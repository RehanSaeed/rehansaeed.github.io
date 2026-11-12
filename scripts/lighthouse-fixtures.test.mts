import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { chromium } from "@playwright/test";

const require = createRequire(import.meta.url);
const installFixtures = require("./lighthouse-fixtures.cjs") as (browser: {
    wsEndpoint: () => string;
}) => Promise<void>;

await test("Lighthouse mocks only this author's flair images and installs once per browser", async (t) => {
    type Fulfillment = {
        status: number;
        contentType: string;
        body: Buffer;
    };
    type Request = {
        request: () => { resourceType: () => string };
        continue: () => Promise<void>;
        fulfill: (options: Fulfillment) => Promise<void>;
    };
    let pattern: RegExp | undefined;
    let handler: ((route: Request) => Promise<void>) | undefined;
    let installations = 0;
    const connection = t.mock.method(
        chromium,
        "connectOverCDP",
        (endpoint: string) => {
            assert.equal(endpoint, "ws://localhost/test");
            return Promise.resolve({
                contexts: () => [
                    {
                        route: (matcher: RegExp, callback: typeof handler) => {
                            installations++;
                            pattern = matcher;
                            handler = callback;
                            return Promise.resolve();
                        },
                    },
                ],
            });
        },
    );
    const browser = { wsEndpoint: () => "ws://localhost/test" };
    await installFixtures(browser);
    await installFixtures(browser);
    assert.equal(connection.mock.callCount(), 1);
    assert.equal(installations, 1);
    assert.ok(pattern);
    assert.ok(handler);
    for (const theme of ["dark", "light"]) {
        assert.ok(
            pattern.test(
                `https://stackoverflow.com/users/flair/1212017.png?theme=${theme}`,
            ),
        );
    }
    for (const url of [
        "https://stackoverflow.com/users/flair/999.png?theme=dark",
        "https://stackoverflow.com/users/flair/1212017.png?theme=dark&other=1",
        "https://stackoverflow.com/users/flair/1212017.png?theme=unknown",
        "https://example.com/users/flair/1212017.png?theme=dark",
        "http://stackoverflow.com/users/flair/1212017.png?theme=dark",
    ]) {
        assert.equal(pattern.test(url), false, url);
    }
    const results: Fulfillment[] = [];
    let continued = 0;
    const request = (resourceType: string): Request => ({
        request: () => ({ resourceType: () => resourceType }),
        continue: () => {
            continued++;
            return Promise.resolve();
        },
        fulfill: (response) => {
            results.push(response);
            return Promise.resolve();
        },
    });
    await handler(request("image"));
    await handler(request("document"));
    await handler(request("fetch"));
    assert.equal(continued, 2);
    assert.equal(results.length, 1);
    assert.equal(results[0].status, 200);
    assert.equal(results[0].contentType, "image/svg+xml");
    const svg = results[0].body.toString();
    assert.match(svg, /width="208" height="58"/);
    assert.match(svg, /Audit fixture \(not live stats\)/);
});

await test("Lighthouse fixture setup errors remain failures", async (t) => {
    t.mock.method(chromium, "connectOverCDP", () => {
        throw new Error("Cannot connect to audit browser");
    });
    await assert.rejects(
        installFixtures({ wsEndpoint: () => "ws://localhost/test" }),
        /Cannot connect to audit browser/,
    );
});
