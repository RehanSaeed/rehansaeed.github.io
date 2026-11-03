import {
  offlineCache,
  offlineCandidates,
  offlineMessageSchema,
  offlineIntegrity,
  offlineKey,
  type OfflineEntry,
} from "../shared/utils/offline";
import { readOfflineState, readOfflineGeneration } from "./offline/storage";
import { stageOffline } from "./offline/staging";

interface WorkerEvent extends Event {
  waitUntil: (promise: Promise<unknown>) => void;
}
interface WorkerMessage extends WorkerEvent {
  data: unknown;
  ports: readonly MessagePort[];
}
interface WorkerFetch extends WorkerEvent {
  request: Request;
  respondWith: (response: Promise<Response>) => void;
}
const worker = self as typeof self & {
  __WB_MANIFEST: OfflineEntry[];
  clients: { claim: () => Promise<void> };
  skipWaiting: () => Promise<void>;
  addEventListener: {
    (
      type: "install" | "activate",
      listener: (event: WorkerEvent) => void,
    ): void;
    (type: "message", listener: (event: WorkerMessage) => void): void;
    (type: "fetch", listener: (event: WorkerFetch) => void): void;
  };
};
const entries = (self as typeof worker).__WB_MANIFEST;
const generationPromise = crypto.subtle
  .digest("SHA-256", new TextEncoder().encode(JSON.stringify(entries)))
  .then((hash) => ({
    id: Array.from(new Uint8Array(hash), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join(""),
    entries,
  }));
const core = entries.filter((entry) =>
  [
    "offline.html",
    "favicon.svg",
    "images/icons/favicon-192x192.png",
    "images/icons/favicon-512x512.png",
    "manifest.webmanifest",
  ].includes(entry.url),
);
if (core.length !== 5) {
  throw new Error("The essential offline manifest is incomplete.");
}

worker.addEventListener("install", (event: WorkerEvent) => {
  event.waitUntil(
    (async () => {
      const { id } = await generationPromise;
      const coreName = `blog-offline-core-${id}`;
      const cache = await caches.open(coreName);
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 20_000);
      try {
        for (const entry of core) {
          const response = await fetch(entry.url, {
            cache: "no-store",
            integrity: entry.integrity,
            signal: controller.signal,
          });
          if (
            !response.ok ||
            !(await offlineIntegrity(response.clone(), entry.integrity))
          ) {
            throw new Error(`Could not install essential asset: ${entry.url}`);
          }
          await cache.put(offlineKey(entry, location.origin), response);
        }
      } finally {
        clearTimeout(timeout);
      }
    })(),
  );
});
worker.addEventListener("activate", (event: WorkerEvent) => {
  event.waitUntil(worker.clients.claim());
});
worker.addEventListener("message", (event: WorkerMessage) => {
  if (
    typeof event.data === "object" &&
    event.data !== null &&
    "type" in event.data &&
    event.data.type === "SKIP_WAITING"
  ) {
    event.waitUntil(worker.skipWaiting());
    return;
  }
  const command = offlineMessageSchema.safeParse(event.data);
  if (!command.success || !event.ports[0]) {
    return;
  }
  const port = event.ports[0];
  event.waitUntil(
    generationPromise
      .then(async (generation) => {
        const latest = generation.entries.find((entry) =>
          entry.url.endsWith("/builds/latest.json"),
        );
        if (latest?.integrity !== command.data.buildIntegrity) {
          throw new Error(
            "The offline reader belongs to a different site version. Apply the site update or reload before saving.",
          );
        }
        const status = await stageOffline(command.data.command, generation);
        if (
          command.data.command !== "status" &&
          typeof BroadcastChannel === "function"
        ) {
          const channel = new BroadcastChannel("blog-offline");
          channel.postMessage("changed");
          channel.close();
        }
        return status;
      })
      .then(
        (status) => {
          port.postMessage({ status });
        },
        (error: unknown) => {
          console.error("[offline] Offline command failed.", error);
          port.postMessage({
            error:
              error instanceof Error
                ? error.message
                : "Offline storage failed.",
          });
        },
      ),
  );
});

const requestKeys = new Map<string, Map<string, string>>();

async function savedResponse(request: Request, currentOnly = false) {
  const { id } = await generationPromise;
  const coreName = `blog-offline-core-${id}`;
  const candidates = offlineCandidates(request.url);
  const state = await readOfflineState();
  if (currentOnly && state.active !== id) {
    return;
  }
  for (const savedId of currentOnly
    ? [state.active]
    : [state.active, state.previous]) {
    if (!savedId) {
      continue;
    }
    const saved = await readOfflineGeneration(savedId);
    const keys =
      requestKeys.get(saved.id) ??
      new Map(
        saved.entries.map((entry) => [
          new URL(entry.url, location.origin).href,
          offlineKey(entry, location.origin),
        ]),
      );
    requestKeys.set(saved.id, keys);
    const key = candidates
      .map((candidate) => keys.get(candidate))
      .find((key) => key !== undefined);
    if (key) {
      const response = await (
        await caches.open(offlineCache(saved.id))
      ).match(key);
      if (response) {
        return response;
      }
    }
  }
  if (currentOnly) {
    return;
  }
  for (const entry of core) {
    if (candidates.includes(new URL(entry.url, location.origin).href)) {
      const response = await (
        await caches.open(coreName)
      ).match(offlineKey(entry, location.origin));
      if (response) {
        return response;
      }
    }
  }
  // Keep the installed Workbox generation readable during the first staged update.
  for (const name of await caches.keys()) {
    if (!name.startsWith("workbox-precache-")) {
      continue;
    }
    const cache = await caches.open(name);
    for (const key of await cache.keys()) {
      const url = new URL(key.url);
      url.searchParams.delete("__WB_REVISION__");
      if (candidates.includes(url.href)) {
        return cache.match(key);
      }
    }
  }
}

worker.addEventListener("fetch", (event: WorkerFetch) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin) {
    return;
  }
  event.respondWith(
    (async () => {
      const metadata = url.pathname === "/_nuxt/builds/latest.json";
      const immutable =
        url.pathname.startsWith("/_nuxt/") &&
        !url.pathname.startsWith("/_nuxt/builds/");
      // Serve a complete current generation atomically, but let a new worker
      // obtain its matching HTML. Fingerprinted assets remain reusable.
      if (!metadata) {
        try {
          const saved = await savedResponse(request, !immutable);
          if (saved) {
            return saved;
          }
        } catch (error) {
          console.error("[offline] Could not read the saved asset.", error);
        }
      }
      // Offline TCP failures can be delayed; reach saved navigation and metadata
      // before the page's own deadlines without timing out unrelated downloads.
      const controller = new AbortController();
      const timeout =
        request.mode === "navigate" || metadata
          ? setTimeout(
              () => {
                controller.abort();
              },
              metadata ? 4_000 : 8_000,
            )
          : undefined;
      try {
        return await fetch(
          request,
          timeout === undefined ? undefined : { signal: controller.signal },
        );
      } catch (error) {
        const saved = await savedResponse(request);
        if (saved) {
          return saved;
        }
        if (request.mode === "navigate") {
          const home = await savedResponse(
            new Request(new URL("/", location.origin)),
          );
          if (home) {
            return home;
          }
          const { id } = await generationPromise;
          const coreName = `blog-offline-core-${id}`;
          const entry = core.find((entry) => entry.url === "offline.html")!;
          const fallback = await (
            await caches.open(coreName)
          ).match(offlineKey(entry, location.origin));
          if (fallback) {
            return fallback;
          }
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    })(),
  );
});
