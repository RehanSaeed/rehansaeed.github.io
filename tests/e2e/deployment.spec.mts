import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { expect, test } from "@playwright/test";
import {
    checkCsp,
    checkPagesSettings,
    verifyArtifact,
    verifyPublished,
} from "../../scripts/pages.mjs";

const oldPolicy =
    "default-src 'self'; script-src 'self' https://www.google-analytics.com/analytics.js 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.github.com https://webmention.io https://www.google-analytics.com; font-src 'self' data:; frame-src 'self' https://www.youtube-nocookie.com; img-src 'self' data: https:; worker-src 'self'";
const policy = oldPolicy
    .replace(
        "script-src 'self'",
        "script-src 'self' https://www.googletagmanager.com",
    )
    .replace(
        "connect-src 'self'",
        "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com",
    );

test("Pages settings reject an unprepared source or lost custom domain", () => {
    expect(() =>
        checkPagesSettings({ build_type: "legacy", cname: "rehansaeed.com" }),
    ).toThrow("Switch Settings");
    expect(() =>
        checkPagesSettings({ build_type: "workflow", cname: null }),
    ).toThrow("custom domain");
    expect(() =>
        checkPagesSettings({ build_type: "workflow", cname: "rehansaeed.com" }),
    ).not.toThrow();
});

test("GA4 requires both vendor scripts and regional collection origins in every enforced policy", () => {
    expect(() => checkCsp([oldPolicy], "")).not.toThrow();
    expect(() => checkCsp([oldPolicy], "G-LOCALTEST")).toThrow(
        "googletagmanager",
    );
    const scriptsOnly = oldPolicy.replace(
        "script-src 'self'",
        "script-src 'self' https://www.googletagmanager.com",
    );
    expect(() => checkCsp([scriptsOnly], "G-LOCALTEST")).toThrow("connect-src");
    expect(() => checkCsp([policy], "G-LOCALTEST")).not.toThrow();
    expect(() => checkCsp([policy, oldPolicy], "G-LOCALTEST")).toThrow();
    expect(() =>
        checkCsp([`${policy}; script-src-elem 'none'`], "G-LOCALTEST"),
    ).toThrow();
    expect(() => checkCsp(["default-src 'self'"], "G-LOCALTEST")).toThrow();
});

test("Published artifact respects Pages limits and resolves all routes and local resources case-sensitively", async () => {
    const routes = readFileSync("tests/parity/urls.txt", "utf8")
        .trim()
        .split(/\r?\n/);
    const result = await verifyArtifact("dist", routes);
    expect(result.routes).toBe(408);
    expect(result.bytes).toBeLessThanOrEqual(1_000_000_000);
});

test("Deployment is main-only, gated by successful build/tests/preflight and preserves hidden public files", () => {
    const workflow = parse(readFileSync(".github/workflows/build.yml", "utf8"));
    const condition =
        "github.event_name != 'pull_request' && github.ref == 'refs/heads/main'";
    expect(workflow.jobs.deploy.if).toBe(condition);
    expect(workflow.jobs.deploy.needs).toBe("build");
    expect(workflow.jobs.deploy.permissions).toEqual({
        contents: "read",
        pages: "write",
        "id-token": "write",
    });
    expect(workflow.jobs.deploy.environment.name).toBe("github-pages");
    expect(workflow.jobs.deploy.concurrency["cancel-in-progress"]).toBe(false);
    const steps = workflow.jobs.build.steps;
    const check = steps.findIndex(
        (step: { name: string }) => step.name === "Check Pages Cutover",
    );
    const upload = steps.findIndex(
        (step: { name: string }) => step.name === "Upload Pages Artifact",
    );
    expect(
        steps.findIndex(
            (step: { name: string }) => step.name === "Playwright Test",
        ),
    ).toBeLessThan(check);
    expect(check).toBeLessThan(upload);
    expect(steps[check].if).toBe(condition);
    expect(steps[upload].if).toBe(condition);
    expect(steps[upload].with).toEqual({
        path: "dist",
        "include-hidden-files": true,
    });
    expect(workflow.permissions.pages).toBe("read");
    const deployment = workflow.jobs.deploy.steps;
    expect(
        deployment.some(
            (step: { name: string }) => step.name === "Verify Published Site",
        ),
    ).toBe(true);
    expect(
        deployment.some((step: { run?: string }) =>
            step.run?.includes("npm ci"),
        ),
    ).toBe(false);
});

test("Post-deployment verification detects stale releases, assets and statuses without changing hosting", async () => {
    const original = globalThis.fetch;
    const deployment = {
        revision: "a".repeat(40),
        files: [
            {
                path: "/file.js",
                status: 200,
                sha256: createHash("sha256").update("compiled").digest("hex"),
            },
            {
                path: "/",
                status: 200,
                contains: ['<main id="main"', "<title>Blog</title>"],
            },
        ],
    };
    try {
        let revision = "b".repeat(40);
        let body = "stale";
        let html =
            '<title>Blog</title><main id="main"></main><script>CDN addition</script>';
        let status = 200;
        globalThis.fetch = async (url) =>
            String(url).endsWith("/deployment.json")
                ? Response.json({ revision })
                : new Response(String(url).endsWith("/") ? html : body, {
                      status,
                  });
        await expect(
            verifyPublished("https://example.test", deployment, 1, 0),
        ).rejects.toThrow("another deployment");
        revision = deployment.revision;
        await expect(
            verifyPublished("https://example.test", deployment, 1, 0),
        ).rejects.toThrow("Stale or modified");
        body = "compiled";
        status = 404;
        await expect(
            verifyPublished("https://example.test", deployment, 1, 0),
        ).rejects.toThrow("HTTP status");
        status = 200;
        await expect(
            verifyPublished("https://example.test", deployment, 1, 0),
        ).resolves.toBeUndefined();
        html = "<title>Stale page</title>";
        await expect(
            verifyPublished("https://example.test", deployment, 1, 0),
        ).rejects.toThrow("Stale or incomplete");
    } finally {
        globalThis.fetch = original;
    }
});

test("GA4 vendor and collector loads pass the corrected CSP without sending tracking data", async ({
    page,
}) => {
    const requests: string[] = [];
    await page.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (
            [
                "www.googletagmanager.com",
                "region1.google-analytics.com",
                "www.google.com",
            ].includes(url.hostname)
        ) {
            requests.push(url.hostname);
            await route.fulfill({
                status: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                contentType: "text/javascript",
                body: "",
            });
        } else if (route.request().resourceType() === "document") {
            const response = await route.fetch();
            await route.fulfill({
                response,
                headers: {
                    ...response.headers(),
                    "content-security-policy": policy,
                },
            });
        } else {
            await route.continue();
        }
    });
    const violations: string[] = [];
    page.on("console", (message) => {
        if (/content security policy/i.test(message.text()))
            violations.push(message.text());
    });
    await page.goto("/");
    await page.evaluate(async () => {
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
                "https://www.googletagmanager.com/gtag/js?id=G-LOCALTEST";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Vendor blocked"));
            document.head.appendChild(script);
        });
        await fetch("https://region1.google-analytics.com/g/collect");
        await fetch("https://www.google.com/");
    });
    expect(requests).toEqual([
        "www.googletagmanager.com",
        "region1.google-analytics.com",
        "www.google.com",
    ]);
    expect(violations).toEqual([]);
});
