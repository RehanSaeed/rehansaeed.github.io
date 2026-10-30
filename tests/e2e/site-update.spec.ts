import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { compileScript, parse } from "vue/compiler-sfc";
import { ref } from "vue";
import { ModuleKind, transpileModule } from "typescript";
import { expect, test } from "@playwright/test";
import type { SoundEffect } from "../../shared/utils/sounds";

const { descriptor } = parse(
  readFileSync("app/components/site-update.vue", "utf8"),
);
const source = transpileModule(
  compileScript(descriptor, { id: "site-update-test" }).content,
  { compilerOptions: { module: ModuleKind.CommonJS } },
).outputText;

function mountUpdate() {
  const errors: unknown[] = [];
  const sounds: SoundEffect[] = [];
  let calls = 0;
  let dismissals = 0;
  const pwa = {
    updateServiceWorker: async () => {
      calls++;
    },
    cancelPrompt: () => {
      dismissals++;
    },
  };
  const module = {
    exports: {} as {
      default: {
        setup: (
          props: object,
          context: object,
        ) => {
          update: () => Promise<void>;
          dismiss: () => void;
          updating: { value: boolean };
          error: { value: string };
        };
      };
    },
  };
  runInNewContext(source, {
    exports: module.exports,
    require: () => ({ defineComponent: (options: unknown) => options }),
    ref,
    useNuxtApp: () => ({ $pwa: pwa }),
    useSoundEffect: () => ({
      play: (sound: SoundEffect) => sounds.push(sound),
    }),
    console: {
      error: (...args: unknown[]) => {
        errors.push(args);
      },
    },
  });
  const state = module.exports.default.setup({}, { expose: () => {} });
  return {
    state,
    pwa,
    errors,
    sounds,
    calls: () => calls,
    dismissals: () => dismissals,
  };
}

test("Update now delegates activation and reload handling to the package", async () => {
  const app = mountUpdate();
  await app.state.update();
  expect(app.calls()).toBe(1);
  expect(app.errors).toHaveLength(0);
  expect(app.state.updating.value).toBe(false);
  expect(app.state.error.value).toBe("");
  expect(app.sounds).toEqual(["update-start"]);
});

test("Concurrent update clicks invoke the package only once", async () => {
  const app = mountUpdate();
  let complete!: () => void;
  let calls = 0;
  app.pwa.updateServiceWorker = () => {
    calls++;
    return new Promise<void>((resolve) => {
      complete = resolve;
    });
  };
  const update = app.state.update();
  expect(app.state.updating.value).toBe(true);
  await app.state.update();
  expect(calls).toBe(1);
  expect(app.sounds).toEqual(["update-start"]);
  complete();
  await update;
  expect(app.state.updating.value).toBe(false);
  expect(app.sounds).toEqual(["update-start"]);
});

test("Only an explicit dismissal plays the close cue", () => {
  const app = mountUpdate();
  expect(app.sounds).toEqual([]);
  expect(app.dismissals()).toBe(0);
  app.state.dismiss();
  expect(app.dismissals()).toBe(1);
  expect(app.sounds).toEqual(["dialog-close"]);
});

test("A package failure is reported and can be retried successfully", async () => {
  const app = mountUpdate();
  app.pwa.updateServiceWorker = async () => {
    throw new Error("Package update failure");
  };
  await app.state.update();
  expect(app.errors).toHaveLength(1);
  expect(app.state.error.value).toContain("The update is not ready.");
  expect(app.state.updating.value).toBe(false);
  app.pwa.updateServiceWorker = async () => {};
  await app.state.update();
  expect(app.state.error.value).toBe("");
  expect(app.state.updating.value).toBe(false);
  expect(app.sounds).toEqual(["update-start", "update-start"]);
});
