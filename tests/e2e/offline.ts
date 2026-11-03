import { expect, type Page } from "@playwright/test";
import {
  offlineStatusSchema,
  type OfflineCommand,
} from "../../shared/utils/offline";

export async function saveWholeBlogOffline(page: Page) {
  await expect(
    page.getByRole("region", { name: "Read offline" }),
  ).toContainText("not fully saved offline");
  await page
    .getByRole("button", { name: "Save the whole blog offline" })
    .click();
  await expect(page.locator("#offline-blog-progress")).toHaveAttribute(
    "value",
    /^[1-9]\d*$/,
  );
  // Avoid the page scheduler competing with the bounded protocol assertions.
  await page.goto("/offline.html");
  const integrity = await page.evaluate(async () => {
    const response = await fetch("/_nuxt/builds/latest.json", {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Cannot read the offline deployment version.");
    }
    const hash = await crypto.subtle.digest(
      "SHA-256",
      await response.arrayBuffer(),
    );
    return `sha256-${btoa(String.fromCharCode(...new Uint8Array(hash)))}`;
  });
  async function send(command: OfflineCommand) {
    const value: unknown = await page.evaluate(
      async ({ command, integrity }) => {
        const worker = navigator.serviceWorker.controller;
        if (!worker) {
          throw new Error("No controlling offline worker.");
        }
        const channel = new MessageChannel();
        return new Promise<unknown>((resolve, reject) => {
          const timeout = setTimeout(() => {
            channel.port1.close();
            reject(new Error("Offline worker did not answer."));
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
      },
      { command, integrity },
    );
    if (
      typeof value === "object" &&
      value !== null &&
      "error" in value &&
      typeof value.error === "string"
    ) {
      throw new Error(value.error);
    }
    return offlineStatusSchema.parse(
      typeof value === "object" && value !== null && "status" in value
        ? value.status
        : value,
    );
  }
  let status = await send("status");
  for (let batch = 0; batch < status.total * 3 && !status.ready; batch++) {
    expect(status.error).toBe("");
    if (status.busy) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      status = await send("status");
    } else {
      status = await send("batch");
    }
  }
  expect(status.ready).toBe(true);
  expect(status.saved).toBe(status.total);
  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Read offline" }),
  ).toContainText("verified and ready offline");
}
