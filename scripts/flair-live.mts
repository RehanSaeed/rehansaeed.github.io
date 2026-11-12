import { chromium } from "@playwright/test";

// Deliberately separate from the deterministic Lighthouse fixture: failure here
// reports the real production dependency rather than a mocked audit result.
const browser = await chromium.launch({
    channel: process.env.CHROME_PATH ? undefined : "chrome",
    executablePath: process.env.CHROME_PATH,
});
try {
    const page = await browser.newPage();
    await page.goto("https://rehansaeed.com/about/");
    const image = page.locator(
        'img[src^="https://stackoverflow.com/users/flair/1212017.png?"]',
    );
    await image.waitFor({ state: "attached" });
    const dimensions = await image.evaluate(async (element) => {
        const image = element as HTMLImageElement;
        await image.decode();
        return { width: image.naturalWidth, height: image.naturalHeight };
    });
    if (dimensions.width !== 208 || dimensions.height !== 58) {
        throw new Error(
            `Live Stack Overflow flair has unexpected dimensions: ${JSON.stringify(dimensions)}`,
        );
    }
    console.log("Live production Stack Overflow flair decoded: 208x58");
} finally {
    await browser.close();
}
