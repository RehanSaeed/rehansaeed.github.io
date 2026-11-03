import { expect, test, type Page } from "@playwright/test";

async function mockOfflineWorker(
  page: Page,
  paused: boolean,
  failure = false,
  unresponsive = false,
  activating = false,
) {
  await page.addInitScript(
    ({ paused, failure, unresponsive, activating }) => {
      const status = {
        generation: "fixture",
        total: 12,
        saved: 4,
        verified: 0,
        ready: false,
        previousReady: false,
        paused,
        busy: false,
        error: "",
      };
      const active = Object.assign(new EventTarget(), {
        scriptURL: `${location.origin}/service-worker.js`,
        state: activating ? "activating" : "activated",
        postMessage({ command }: { command: string }, ports: MessagePort[]) {
          if (unresponsive) {
            const root = document.documentElement;
            root.dataset.offlineCommands = String(
              Number(root.dataset.offlineCommands ?? 0) + 1,
            );
            return;
          }
          if (command === "start") {
            status.paused = false;
            status.error = "";
            failure = false;
          } else if (command === "pause") {
            status.paused = true;
          } else if (command === "batch" && !status.paused) {
            const root = document.documentElement;
            root.dataset.offlineBatches = String(
              Number(root.dataset.offlineBatches ?? 0) + 1,
            );
            if (failure) {
              status.error = "An asset could not be saved. Please retry.";
              status.paused = true;
            } else if (status.saved < status.total) {
              status.saved = Math.min(status.total, status.saved + 6);
            } else {
              status.verified = status.total;
              status.ready = true;
            }
          }
          ports[0]!.postMessage({ status: { ...status } });
        },
      });
      const registration = Object.assign(new EventTarget(), {
        active,
        installing: null,
        waiting: null,
        scope: `${location.origin}/`,
        update: () => Promise.resolve(),
      });
      Object.defineProperty(navigator.serviceWorker, "controller", {
        get: () => active,
      });
      Object.defineProperty(navigator.serviceWorker, "getRegistration", {
        value: () => Promise.resolve(registration),
      });
      Object.defineProperty(navigator.serviceWorker, "register", {
        value: () => Promise.resolve(registration),
      });
      Object.defineProperty(navigator.serviceWorker, "ready", {
        value: Promise.resolve(registration),
      });
    },
    { paused, failure, unresponsive, activating },
  );
}

test("A valid reply from a claimed controller enables controls before its state notification arrives", async ({
  page,
}) => {
  await mockOfflineWorker(page, true, false, false, true);
  await page.goto("/");
  const region = page.getByRole("region", { name: "Read offline" });
  await expect(region).toContainText("not fully saved offline");
  await expect(
    region.getByRole("button", { name: "Resume offline download" }),
  ).toBeEnabled();
});

test("An unresponsive legacy worker stops recovery polling and asks for a site update", async ({
  page,
}) => {
  await page.clock.install();
  await mockOfflineWorker(page, false, false, true);
  await page.goto("/");
  const region = page.getByRole("region", { name: "Read offline" });
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-offline-commands", "1");
  await page.clock.runFor(12_001);
  await expect(region).toContainText("download was interrupted");
  await page.clock.runFor(1_001);
  await expect(root).toHaveAttribute("data-offline-commands", "2");
  await page.clock.runFor(12_001);
  await expect(region).toContainText("Apply any site update");
  await page.clock.runFor(60_000);
  await expect(root).toHaveAttribute("data-offline-commands", "2");
});

test("A subsequent suitable visit resumes consented downloads and verifies before reporting readiness", async ({
  page,
}) => {
  await mockOfflineWorker(page, false);
  await page.goto("/");
  const region = page.getByRole("region", { name: "Read offline" });
  await expect(region).toContainText("verified and ready offline");
  await expect(page.locator("html")).toHaveAttribute(
    "data-offline-batches",
    "3",
  );
  await expect(region.getByRole("button", { name: /Save|Resume/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Install the app" }),
  ).toBeHidden();
});

test("Paused downloads wait for explicit resume and expose labelled progress", async ({
  page,
}) => {
  await mockOfflineWorker(page, true);
  await page.goto("/");
  const region = page.getByRole("region", { name: "Read offline" });
  await expect(region).toContainText("not fully saved offline");
  await expect(region.locator("progress")).toHaveAccessibleName(
    "4 of 12 assets saved",
  );
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-offline-batches",
  );
  const resume = region.getByRole("button", {
    name: "Resume offline download",
  });
  await resume.focus();
  await expect(resume).toBeFocused();
  await resume.press("Enter");
  await expect(region).toContainText("verified and ready offline");
});

test("Partial failures stay visible and require retry rather than claiming completion", async ({
  page,
}) => {
  await mockOfflineWorker(page, false, true);
  await page.goto("/");
  const region = page.getByRole("region", { name: "Read offline" });
  await expect(region.getByRole("status")).toContainText(
    "An asset could not be saved",
  );
  await expect(region.locator("progress")).toHaveAttribute("value", "4");
  await region.getByRole("button", { name: "Retry offline download" }).click();
  await expect(region).toContainText("verified and ready offline");
});

test("A page from another deployment cannot claim readiness or resume downloads", async ({
  page,
}) => {
  await mockOfflineWorker(page, false);
  await page.route("**/_nuxt/builds/latest.json", (route) =>
    route.fulfill({ json: { id: "another-deployment" } }),
  );
  await page.goto("/");
  const region = page.getByRole("region", { name: "Read offline" });
  await expect(region.getByRole("status")).toContainText(
    "different site version",
  );
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-offline-batches",
  );
  await expect(region).not.toContainText("verified and ready offline");
  await page.unroute("**/_nuxt/builds/latest.json");
  await region
    .getByRole("button", { name: "Check offline reader again" })
    .click();
  await expect(region).toContainText("verified and ready offline");
});
