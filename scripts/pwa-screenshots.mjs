import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:8080";
const browser = await chromium.launch();
try {
    for (const [formFactor, viewport] of [
        ["wide", { width: 1440, height: 900 }],
        ["narrow", { width: 390, height: 844 }],
    ]) {
        const context = await browser.newContext({
            viewport,
            deviceScaleFactor: 1,
            colorScheme: "light",
            reducedMotion: "reduce",
            serviceWorkers: "block",
        });
        const page = await context.newPage();
        await page.route(
            (url) => url.origin !== new URL(baseURL).origin,
            (route) => route.abort(),
        );
        for (const [name, path] of [
            ["blog", "/"],
            ["portfolio", "/portfolio/"],
            ["about", "/about/"],
        ]) {
            console.info(`Capturing ${name} (${formFactor})`);
            const response = await page.goto(new URL(path, baseURL).href, {
                waitUntil: "domcontentloaded",
                timeout: 90_000,
            });
            if (!response?.ok()) {
                throw new Error(`Could not load ${path}`);
            }
            await page
                .getByRole("button", { name: "Open search", exact: true })
                .waitFor();
            await page.waitForFunction(
                () =>
                    !document
                        .querySelector('button[aria-label="Open search"]')
                        ?.hasAttribute("disabled"),
            );
            await page.evaluate(async () => {
                await document.fonts.ready;
                await Promise.all(
                    Array.from(document.images)
                        .filter((image) => {
                            const rect = image.getBoundingClientRect();
                            return rect.top < innerHeight && rect.bottom > 0;
                        })
                        .map((image) => image.decode()),
                );
            });
            await page.screenshot({
                path: fileURLToPath(
                    new URL(
                        `../public/images/screenshots/${name}-${formFactor}.png`,
                        import.meta.url,
                    ),
                ),
                animations: "disabled",
            });
        }
        await context.close();
    }
} finally {
    await browser.close();
}
