import {
  offlineCache,
  offlineIntegrity,
  offlineKey,
  type OfflineCommand,
  type OfflineGeneration,
  type OfflineState,
  type OfflineStatus,
} from "../../shared/utils/offline";
import {
  changeOfflineState,
  readOfflineState,
  readOfflineGeneration,
  saveOfflineGeneration,
  removeOfflineGeneration,
} from "./storage";

const origin = globalThis.location.origin;

async function present(generation: OfflineGeneration) {
  const cache = await caches.open(offlineCache(generation.id));
  const keys = new Set((await cache.keys()).map((key) => key.url));
  return generation.entries.filter((entry) =>
    keys.has(offlineKey(entry, origin)),
  ).length;
}

export async function offlineStatus(
  generation: OfflineGeneration,
): Promise<OfflineStatus> {
  const state = await readOfflineState();
  const active = state.active
    ? await readOfflineGeneration(state.active)
    : undefined;
  const activeCount = active ? await present(active) : 0;
  const activeReady = !!active && activeCount === active.entries.length;
  const pending =
    state.pending?.generation === generation.id ? state.pending : undefined;
  return {
    generation: generation.id,
    total: generation.entries.length,
    saved: await present(generation),
    verified: pending?.phase === "verify" ? pending.cursor : 0,
    ready: activeReady && state.active === generation.id,
    previousReady: activeReady && state.active !== generation.id,
    paused: pending?.paused ?? true,
    busy: !!state.lease && state.lease.until > Date.now(),
    error: pending?.error ?? "",
  };
}

export async function stageOffline(
  command: OfflineCommand,
  generation: OfflineGeneration,
) {
  if (command === "status") {
    return offlineStatus(generation);
  }
  if (command === "pause") {
    await changeOfflineState((state) => {
      if (state.pending?.generation === generation.id) {
        state.pending.paused = true;
      }
      return state;
    });
    return offlineStatus(generation);
  }

  if (command === "start") {
    await saveOfflineGeneration(generation);
  }
  const token = crypto.randomUUID();
  const state = await changeOfflineState((state) => {
    if (state.lease && state.lease.until > Date.now()) {
      if (command === "start" && state.pending?.generation === generation.id) {
        state.pending.paused = false;
        state.pending.error = "";
      }
      return state;
    }
    state.lease = { token, until: Date.now() + 15_000 };
    if (command === "start") {
      if (state.pending?.generation !== generation.id) {
        state.pending = {
          generation: generation.id,
          cursor: 0,
          phase: "download",
          paused: false,
          error: "",
        };
      } else {
        state.pending.paused = false;
        state.pending.error = "";
      }
    }
    return state;
  });
  if (state.lease?.token !== token) {
    return offlineStatus(generation);
  }
  if (command === "start") {
    try {
      const retained = new Set([
        offlineCache(generation.id),
        state.active && offlineCache(state.active),
        state.previous && offlineCache(state.previous),
      ]);
      for (const name of await caches.keys()) {
        if (name.startsWith("blog-offline-full-") && !retained.has(name)) {
          await caches.delete(name);
          await removeOfflineGeneration(
            name.slice("blog-offline-full-".length),
          );
        }
      }
    } finally {
      await changeOfflineState((current) => {
        if (current.lease?.token === token) {
          delete current.lease;
        }
        return current;
      });
    }
    return offlineStatus(generation);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 8_000);
  const update = async (change: (state: OfflineState) => void) => {
    await changeOfflineState((current) => {
      // A terminated worker's delayed result must never commit over a new lease.
      if (current.lease?.token !== token) {
        throw new Error("Another worker resumed this offline download.");
      }
      change(current);
      return current;
    });
  };
  try {
    const cache = await caches.open(offlineCache(generation.id));
    let cursor = state.pending?.cursor ?? 0;
    let transitioned = false;
    const pending = state.pending;
    for (let count = 0; count < 6; count++) {
      if (
        controller.signal.aborted ||
        !pending ||
        pending.generation !== generation.id ||
        pending.paused
      ) {
        break;
      }
      const entry = generation.entries[cursor];
      if (!entry) {
        transitioned = true;
        if (pending.phase === "download") {
          await update((current) => {
            if (current.pending) {
              current.pending.phase = "verify";
              current.pending.cursor = 0;
            }
          });
        } else {
          if ((await present(generation)) !== generation.entries.length) {
            throw new Error(
              "Saved assets were evicted. Retry to repair the download.",
            );
          }
          await update((current) => {
            current.previous = current.active;
            current.active = generation.id;
            delete current.pending;
          });
        }
        break;
      }
      const key = offlineKey(entry, origin);
      let response = await cache.match(key);
      if (
        response &&
        !(await offlineIntegrity(response.clone(), entry.integrity))
      ) {
        await cache.delete(key);
        response = undefined;
      }
      if (!response) {
        if (pending.phase === "verify") {
          throw new Error(
            `Saved asset is missing: ${entry.url}. Retry to repair it.`,
          );
        }
        try {
          response = await fetch(new URL(entry.url, origin), {
            cache: "no-store",
            signal: controller.signal,
            integrity: entry.integrity,
            credentials: "same-origin",
            redirect: "error",
          });
        } catch (error) {
          throw new Error(
            `Could not download or verify ${entry.url}. Check your connection and any site update, then retry.`,
            { cause: error },
          );
        }
        if (
          !response.ok ||
          !(await offlineIntegrity(response.clone(), entry.integrity))
        ) {
          throw new Error(
            `Could not verify ${entry.url} (${response.status}).`,
          );
        }
        await cache.put(key, response);
      }
      cursor++;
    }
    if (!transitioned) {
      await update((current) => {
        if (current.pending) {
          current.pending.cursor = cursor;
        }
      });
    }
  } catch (error) {
    console.error("[offline] Download batch failed.", error);
    await update((current) => {
      if (current.pending) {
        current.pending.error =
          error instanceof DOMException && error.name === "QuotaExceededError"
            ? "Offline storage is full. Free browser storage, then retry."
            : error instanceof Error
              ? error.message
              : "Offline storage failed.";
        current.pending.paused = true;
        current.pending.phase = "download";
        current.pending.cursor = 0;
      }
    });
  } finally {
    clearTimeout(timeout);
    await changeOfflineState((current) => {
      if (current.lease?.token === token) {
        delete current.lease;
      }
      return current;
    });
  }
  return offlineStatus(generation);
}
