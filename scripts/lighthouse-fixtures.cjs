const { readFile } = require("node:fs/promises");
const { join } = require("node:path");
const { chromium } = require("@playwright/test");

const configuredBrowsers = new WeakSet();

// LHCI invokes this before Lighthouse creates its page. Context routing also
// covers that new page without racing a target-created callback.
module.exports = async (browser) => {
    if (configuredBrowsers.has(browser)) {
        return;
    }
    const body = await readFile(
        join(__dirname, "..", "tests", "fixtures", "stackoverflow-flair.svg"),
    );
    const connection = await chromium.connectOverCDP(browser.wsEndpoint());
    const [context] = connection.contexts();
    if (!context) {
        throw new Error(
            "Lighthouse fixture requires the default browser context",
        );
    }
    await context.route(
        /^https:\/\/stackoverflow\.com\/users\/flair\/1212017\.png\?theme=(?:dark|light)$/,
        async (route) => {
            if (route.request().resourceType() !== "image") {
                await route.continue();
                return;
            }
            await route.fulfill({
                status: 200,
                contentType: "image/svg+xml",
                body,
            });
        },
    );
    configuredBrowsers.add(browser);
    console.log(
        "Lighthouse: mocking only Stack Overflow flair 1212017; production availability is not audited. Run npm run test:flair-live separately.",
    );
};
