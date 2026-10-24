import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { compileScript, parse } from "vue/compiler-sfc";
import { ref } from "vue";
import { ModuleKind, transpileModule } from "typescript";
import { expect, test } from "@playwright/test";

const { descriptor } = parse(
  readFileSync("app/components/site-update.vue", "utf8"),
);
const source = transpileModule(
  compileScript(descriptor, { id: "site-update-test" }).content,
  { compilerOptions: { module: ModuleKind.CommonJS } },
).outputText;

function mountUpdate() {
  const reloads: number[] = [];
  const errors: unknown[] = [];
  const messages: unknown[] = [];
  const timers = new Set<() => void>();
  const registration = {
    waiting: null as { postMessage: (message: unknown) => void } | null,
    installing: null as (EventTarget & { state: string }) | null,
    update: async () => {},
  };
  const navigator = {
    onLine: true,
    serviceWorker: {
      controller: {},
      getRegistration: async () =>
        registration as typeof registration | undefined,
    },
  };
  let callbacks: {
    onRegisteredSW: (url: string, registration: unknown) => void;
    onNeedReload: () => void;
  };
  let mounted: () => void;
  let unmounted: () => void;
  const module = {
    exports: {} as {
      default: {
        setup: (
          props: object,
          context: object,
        ) => {
          update: () => Promise<void>;
          available: { value: boolean };
          updating: { value: boolean };
          error: { value: string };
        };
      };
    },
  };
  runInNewContext(source, {
    exports: module.exports,
    require: (id: string) =>
      id === "vue"
        ? { defineComponent: (options: unknown) => options }
        : id === "virtual:pwa-register"
          ? {
              registerSW: (options: typeof callbacks) => {
                callbacks = options;
              },
            }
          : {},
    ref,
    onMounted: (callback: () => void) => {
      mounted = callback;
    },
    onUnmounted: (callback: () => void) => {
      unmounted = callback;
    },
    useSkewProtection: () => ({
      onAppOutdated: () => {},
      onCurrentChunksOutdated: () => {},
    }),
    useNuxtApp: () => ({ hook: () => () => {} }),
    navigator,
    window: {
      location: {
        reload: () => {
          reloads.push(1);
        },
      },
    },
    console: {
      error: (...args: unknown[]) => {
        errors.push(args);
      },
    },
    setTimeout: (callback: () => void) => {
      timers.add(callback);
      return callback;
    },
    clearTimeout: (callback: () => void) => {
      timers.delete(callback);
    },
  });
  const state = module.exports.default.setup({}, { expose: () => {} });
  mounted!();
  callbacks!.onRegisteredSW("", registration);
  return {
    state,
    registration,
    navigator,
    reloads,
    errors,
    messages,
    timers,
    callbacks: callbacks!,
    unmount: () => unmounted!(),
    waitingWorker: {
      postMessage: (message: unknown) => {
        messages.push(message);
      },
    },
  };
}

test("A deployment without a waiting worker reloads once instead of leaving Update now stuck", async () => {
  const app = mountUpdate();
  await app.state.update();
  await app.state.update();
  expect(app.reloads).toHaveLength(1);
  expect(app.errors).toHaveLength(0);
  expect(app.state.error.value).toBe("");
  app.unmount();
});

test("A downloaded waiting worker can be approved offline without another update check", async () => {
  const app = mountUpdate();
  app.navigator.onLine = false;
  app.registration.waiting = app.waitingWorker;
  app.registration.update = async () => {
    throw new Error("Offline");
  };
  await app.state.update();
  await app.state.update();
  expect(app.messages).toEqual([
    { type: "SKIP_WAITING", readerApproved: true },
  ]);
  expect(app.reloads).toHaveLength(0);
  expect(app.state.updating.value).toBe(true);
  app.callbacks.onNeedReload();
  app.callbacks.onNeedReload();
  expect(app.reloads).toHaveLength(1);
  expect(app.timers.size).toBe(0);
  expect(app.errors).toHaveLength(0);
  app.unmount();
});

test("An installing update is approved only after installation completes", async () => {
  const app = mountUpdate();
  const worker = Object.assign(new EventTarget(), { state: "installing" });
  app.registration.installing = worker;
  const update = app.state.update();
  await expect.poll(() => app.timers.size).toBe(1);
  expect(app.messages).toHaveLength(0);
  expect(app.reloads).toHaveLength(0);
  app.registration.waiting = app.waitingWorker;
  worker.state = "installed";
  worker.dispatchEvent(new Event("statechange"));
  await update;
  expect(app.messages).toHaveLength(1);
  app.callbacks.onNeedReload();
  expect(app.reloads).toHaveLength(1);
  app.unmount();
});

test("A failed installation does not reload and leaves Update now available", async () => {
  const app = mountUpdate();
  const worker = Object.assign(new EventTarget(), { state: "installing" });
  app.registration.installing = worker;
  const update = app.state.update();
  await expect.poll(() => app.timers.size).toBe(1);
  worker.state = "redundant";
  worker.dispatchEvent(new Event("statechange"));
  await update;
  expect(app.reloads).toHaveLength(0);
  expect(app.messages).toHaveLength(0);
  expect(app.errors).toHaveLength(1);
  expect(app.state.updating.value).toBe(false);
  expect(app.timers.size).toBe(0);
  app.unmount();
});

test("A failed update stays visible and can be retried successfully", async () => {
  const app = mountUpdate();
  app.registration.update = async () => {
    throw new Error("Network failure");
  };
  await app.state.update();
  expect(app.reloads).toHaveLength(0);
  expect(app.errors).toHaveLength(1);
  expect(app.state.error.value).toContain("The update is not ready.");
  expect(app.state.updating.value).toBe(false);
  app.registration.update = async () => {};
  await app.state.update();
  expect(app.reloads).toHaveLength(1);
  expect(app.state.error.value).toBe("");
  app.unmount();
});

test("Activation in another tab does not reload until the reader approves", async () => {
  const app = mountUpdate();
  app.callbacks.onNeedReload();
  expect(app.state.available.value).toBe(true);
  expect(app.reloads).toHaveLength(0);
  app.registration.update = async () => {
    throw new Error("Must not check again");
  };
  await app.state.update();
  expect(app.reloads).toHaveLength(1);
  expect(app.errors).toHaveLength(0);
  app.unmount();
});

test("An existing registration is recovered before the registration callback arrives", async () => {
  const app = mountUpdate();
  app.callbacks.onRegisteredSW("", undefined);
  app.registration.waiting = app.waitingWorker;
  await app.state.update();
  expect(app.messages).toHaveLength(1);
  expect(app.reloads).toHaveLength(0);
  expect(app.errors).toHaveLength(0);
  app.unmount();
  expect(app.timers.size).toBe(0);
});

for (const online of [true, false]) {
  test(`An unavailable registration ${online ? "reloads online" : "reports an offline error"}`, async () => {
    const app = mountUpdate();
    app.callbacks.onRegisteredSW("", undefined);
    app.navigator.serviceWorker.getRegistration = async () => undefined;
    app.navigator.onLine = online;
    await app.state.update();
    expect(app.reloads).toHaveLength(online ? 1 : 0);
    expect(app.errors).toHaveLength(online ? 0 : 1);
    app.unmount();
  });
}
