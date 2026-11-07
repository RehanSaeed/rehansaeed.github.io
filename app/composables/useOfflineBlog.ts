import { z } from "zod";
import {
  offlineStatusSchema,
  type OfflineCommand,
  type OfflineStatus,
} from "../../shared/utils/offline";

const replySchema = z.union([
  z.object({ status: offlineStatusSchema }),
  z.object({ error: z.string() }),
]);
const buildSchema = z.object({ id: z.string() });
class OfflineInterruptedError extends Error {}

export function useOfflineBlog() {
  const status = ref<OfflineStatus>();
  const error = ref("");
  const activated = ref(false);
  const working = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let failed = false;
  let interrupted = false;
  const app = useRuntimeConfig().app;
  let buildIntegrity: Promise<string> | undefined;
  let channel: BroadcastChannel | undefined;

  function pageBuildIntegrity() {
    buildIntegrity ??= (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 8_000);
      try {
        const response = await fetch(
          `${app.buildAssetsDir}builds/latest.json`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          throw new Error(
            "Could not verify the site version. Retry when online.",
          );
        }
        const bytes = await response.arrayBuffer();
        const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
        if (buildSchema.parse(value).id !== app.buildId) {
          throw new Error(
            "A different site version is available. Reload before saving the blog.",
          );
        }
        const hash = await crypto.subtle.digest("SHA-256", bytes);
        return `sha256-${btoa(String.fromCharCode(...new Uint8Array(hash)))}`;
      } finally {
        clearTimeout(timeout);
      }
    })();
    return buildIntegrity;
  }

  async function send(command: OfflineCommand) {
    const worker = navigator.serviceWorker.controller;
    activated.value = worker?.state === "activated";
    if (!worker) {
      return;
    }
    const integrity = await pageBuildIntegrity();
    const channel = new MessageChannel();
    const value = await new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        channel.port1.close();
        reject(
          new OfflineInterruptedError(
            "The offline download was interrupted. Checking saved progress.",
          ),
        );
      }, 12_000);
      channel.port1.onmessage = (event: MessageEvent<unknown>) => {
        clearTimeout(timeout);
        channel.port1.close();
        resolve(event.data);
      };
      worker.postMessage({ command, buildIntegrity: integrity }, [
        channel.port2,
      ]);
    });
    const reply = replySchema.parse(value);
    // controllerchange can precede the page's activated-state notification.
    activated.value = true;
    if ("error" in reply) {
      throw new Error(reply.error);
    }
    status.value = reply.status;
  }

  function schedule() {
    clearTimeout(timer);
    if (
      !disposed &&
      !failed &&
      status.value &&
      !status.value.paused &&
      !status.value.ready &&
      navigator.onLine &&
      document.visibilityState === "visible"
    ) {
      timer = setTimeout(
        () => void run("status"),
        status.value.busy ? 1_000 : 50,
      );
    } else if (!disposed && !failed && error.value) {
      timer = setTimeout(() => void run("status"), 1_000);
    }
  }

  async function run(command: OfflineCommand) {
    if (working.value && command !== "pause") {
      return;
    }
    working.value = true;
    if (command === "start") {
      failed = false;
      buildIntegrity = undefined;
    }
    try {
      await send(command);
      interrupted = false;
      if (!failed) {
        error.value = "";
      }
      if (
        command === "status" &&
        !failed &&
        !disposed &&
        status.value &&
        !status.value.paused &&
        !status.value.ready &&
        !status.value.busy &&
        navigator.onLine &&
        document.visibilityState === "visible"
      ) {
        await send("batch");
      }
    } catch (cause) {
      failed = !(cause instanceof OfflineInterruptedError) || interrupted;
      interrupted = cause instanceof OfflineInterruptedError;
      console.error("[offline] Offline reader failed.", cause);
      error.value =
        failed && cause instanceof OfflineInterruptedError
          ? "The offline reader did not respond. Apply any site update, or reload and retry."
          : cause instanceof Error
            ? cause.message
            : "Offline storage failed.";
      status.value = undefined;
    } finally {
      working.value = false;
      schedule();
    }
  }

  onMounted(() => {
    if (!("serviceWorker" in navigator)) {
      error.value = "This browser does not support the offline reader.";
      return;
    }
    void run("status");
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    navigator.serviceWorker.addEventListener("controllerchange", refresh);
    if (typeof BroadcastChannel === "function") {
      channel = new BroadcastChannel("blog-offline");
      channel.onmessage = () => {
        if (document.visibilityState === "visible") {
          void run("status");
        }
      };
    }
  });
  function refresh() {
    if (document.visibilityState === "visible") {
      failed = false;
      interrupted = false;
      buildIntegrity = undefined;
      void run("status");
    }
  }
  onBeforeUnmount(() => {
    disposed = true;
    clearTimeout(timer);
    window.removeEventListener("online", refresh);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.removeEventListener("controllerchange", refresh);
    }
    channel?.close();
  });
  return { status, error, activated, working, run, refresh };
}
