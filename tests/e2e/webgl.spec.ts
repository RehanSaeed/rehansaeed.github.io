import { expect, test } from "@playwright/test";

test("WebGL2 can render and read a pixel", async ({ page }) => {
  const pixel = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("webgl2");
    if (!context) {
      throw new Error("The browser test environment must support WebGL2.");
    }

    context.clearColor(0, 1, 0, 1);
    context.clear(context.COLOR_BUFFER_BIT);
    const result = new Uint8Array(4);
    context.readPixels(0, 0, 1, 1, context.RGBA, context.UNSIGNED_BYTE, result);
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return [...result];
  });

  expect(pixel).toEqual([0, 255, 0, 255]);
});
