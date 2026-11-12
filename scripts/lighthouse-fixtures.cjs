const { chromium } = require("@playwright/test");
const configuredBrowsers = new WeakSet();

// Context routing covers Lighthouse's new page before it can load the badge.
module.exports = async (browser) => {
    if (configuredBrowsers.has(browser)) {
        return;
    }
    const connection = await chromium.connectOverCDP(browser.wsEndpoint());
    await connection
        .contexts()[0]
        .route(
            /^https:\/\/stackoverflow\.com\/users\/flair\/1212017\.png\?theme=(?:dark|light)$/,
            (route) =>
                route.request().resourceType() === "image"
                    ? route.fulfill({
                          contentType: "image/svg+xml",
                          body: '<svg xmlns="http://www.w3.org/2000/svg" width="208" height="58"><rect width="208" height="58" fill="#222"/><text x="8" y="33" fill="white" font-size="13">Stack Overflow test fixture</text></svg>',
                      })
                    : route.continue(),
        );
    configuredBrowsers.add(browser);
    console.log(
        "Lighthouse: only Stack Overflow flair 1212017 is mocked; live availability is not audited.",
    );
};
