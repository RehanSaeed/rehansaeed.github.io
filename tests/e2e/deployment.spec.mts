import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
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

for (const directory of [".data", "__link-checker__"]) {
    test(`Pages artifacts reject private reports in ${directory}`, async ({}, testInfo) => {
        const artifact = testInfo.outputPath("artifact");
        const report = join(artifact, directory);
        await mkdir(report, { recursive: true });
        await writeFile(join(report, "report.json"), "{}");
        await expect(verifyArtifact(artifact, [])).rejects.toThrow(
            "Private build file",
        );
    });
}

test("Image automation commits through Git LFS rather than the action's raw-blob API", () => {
    const workflow = parse(
        readFileSync(".github/workflows/compress-images.yml", "utf8"),
    );
    const job = workflow.jobs.build;
    expect(job.permissions).toEqual({
        contents: "write",
        "pull-requests": "read",
    });
    const checkout = job.steps.find(
        (step: { name: string }) => step.name === "Checkout",
    );
    expect(checkout.with).toEqual({
        lfs: true,
        ref: "${{ github.head_ref }}",
    });
    const compress = job.steps.find(
        (step: { name: string }) => step.name === "Compress Images",
    );
    expect(compress.with.compressOnly).toBe(true);
    const commit = job.steps.find(
        (step: { name: string }) =>
            step.name === "Commit optimized images with LFS",
    );
    expect(commit.env.PR_BRANCH).toBe("${{ github.head_ref }}");
    expect(commit.run).toContain("git add --renormalize -- .");
    expect(commit.run).toContain("git diff --cached --quiet");
    expect(commit.run.indexOf("git commit")).toBeLessThan(
        commit.run.indexOf("git lfs fsck --pointers"),
    );
    expect(commit.run.indexOf("git lfs fsck --pointers")).toBeLessThan(
        commit.run.indexOf('git push origin "HEAD:$PR_BRANCH"'),
    );
    expect(commit.run).not.toMatch(/--force|--amend/);
    const build = parse(readFileSync(".github/workflows/build.yml", "utf8"));
    expect(
        build.jobs.build.steps.find(
            (step: { name: string }) => step.name === "Check Git LFS Pointers",
        ).run,
    ).toBe("git lfs fsck --pointers");
});

test("Deployment is main-only, gated by successful build/tests/preflight and preserves hidden public files", () => {
    const workflow = parse(readFileSync(".github/workflows/build.yml", "utf8"));
    const condition =
        "github.event_name != 'pull_request' && github.ref == 'refs/heads/main'";
    expect(workflow.jobs.deploy.if).toBe(condition);
    expect(workflow.jobs.deploy.needs).toEqual(["build", "test"]);
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
    expect(check).toBeGreaterThan(-1);
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

test("Browser suites run in parallel against one complete build without dropping coverage", () => {
    const workflow = parse(readFileSync(".github/workflows/build.yml", "utf8"));
    const build = workflow.jobs.build;
    const browserTests = workflow.jobs.test;
    expect(build.name).toBe("Generate");
    expect(workflow.jobs.checks).toEqual({
        name: "Build",
        if: "always() && (github.event_name != 'pull_request' || !github.event.pull_request.draft)",
        needs: ["build", "test"],
        "runs-on": "ubuntu-latest",
        steps: [
            {
                name: "Require Generation and All Browsers",
                run: 'test "$BUILD_RESULT" = success && test "$TEST_RESULT" = success',
                env: {
                    BUILD_RESULT: "${{ needs.build.result }}",
                    TEST_RESULT: "${{ needs.test.result }}",
                },
            },
        ],
    });
    expect(browserTests.needs).toBe("build");
    expect(browserTests.strategy).toEqual({
        "fail-fast": false,
        matrix: { browser: ["chrome", "edge", "firefox"] },
    });
    expect(build.steps).toContainEqual({
        name: "Package Browser Test Site",
        run: "tar -cf playwright-site.tar dist .data/blog-image-metadata.json",
    });
    const upload = build.steps.find(
        (step: { name: string }) => step.name === "Upload Browser Test Site",
    );
    const download = browserTests.steps.find(
        (step: { name: string }) => step.name === "Download Browser Test Site",
    );
    expect(upload.with.name).toBe("playwright-site");
    expect(upload.with.path).toBe("playwright-site.tar");
    expect(upload.with["if-no-files-found"]).toBe("error");
    expect(download.with.name).toBe(upload.with.name);
    const steps = browserTests.steps;
    const extract = steps.findIndex(
        (step: { name: string }) => step.name === "Extract Browser Test Site",
    );
    const run = steps.findIndex(
        (step: { name: string }) => step.name === "Playwright Test",
    );
    expect(extract).toBeGreaterThan(
        steps.findIndex(
            (step: { name: string }) => step.name === "NPM Install",
        ),
    );
    expect(extract).toBeLessThan(run);
    expect(steps[extract].run).toBe("tar -xf playwright-site.tar");
    expect(steps[run].run).toBe(
        "npx playwright test --project=${{ matrix.browser }}",
    );
    expect(
        steps.some((step: { run?: string }) => step.run === "npm run build"),
    ).toBe(false);
    for (const name of [
        "Cache Playwright Browsers",
        "Install Playwright Browsers",
        "Install Playwright Dependencies",
    ]) {
        expect(
            steps.find((step: { name: string }) => step.name === name).if,
        ).toContain("matrix.browser == 'firefox'");
    }
    const report = steps.find(
        (step: { name: string }) => step.name === "Upload Playwright Report",
    );
    expect(report.if).toBe("failure()");
    expect(report.with.name).toBe("playwright-report-${{ matrix.browser }}");
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
    const loaderRequests: string[] = [];
    await page.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (
            [
                "www.googletagmanager.com",
                "region1.google-analytics.com",
                "www.google.com",
            ].includes(url.hostname)
        ) {
            // Keep the explicit probes separate from the app's configured GA4 loader.
            if (url.searchParams.has("csp-probe")) requests.push(url.hostname);
            else loaderRequests.push(url.href);
            await route.fulfill({
                status: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                contentType: "text/javascript",
                body: "",
            });
        } else if (route.request().resourceType() === "document") {
            const response = await route.fetch();
            // Enable the real app loader even in artifacts built without a GA4 ID.
            const body = (await response.text()).replace(
                /googleAnalyticsId:"[^"]*"/,
                'googleAnalyticsId:"G-APPTEST"',
            );
            expect(body).toContain('googleAnalyticsId:"G-APPTEST"');
            await route.fulfill({
                response,
                body,
                headers: {
                    ...response.headers(),
                    "content-length": String(Buffer.byteLength(body)),
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
    await expect
        .poll(() =>
            loaderRequests.map((url) => new URL(url).searchParams.get("id")),
        )
        .toContain("G-APPTEST");
    await page.evaluate(async () => {
        const loadVendor = (src: string) =>
            new Promise<void>((resolve, reject) => {
                const script = document.createElement("script");
                script.src = src;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error("Vendor blocked"));
                document.head.appendChild(script);
            });
        await loadVendor(
            "https://www.googletagmanager.com/gtag/js?id=G-LOCALTEST&csp-probe=1",
        );
        await fetch(
            "https://region1.google-analytics.com/g/collect?csp-probe=1",
        );
        await fetch("https://www.google.com/?csp-probe=1");
        // Also exercise an untagged loader arriving after the probes.
        await loadVendor(
            "https://www.googletagmanager.com/gtag/js?id=G-APPTEST&order=after",
        );
    });
    expect(requests).toEqual([
        "www.googletagmanager.com",
        "region1.google-analytics.com",
        "www.google.com",
    ]);
    expect(loaderRequests).toContain(
        "https://www.googletagmanager.com/gtag/js?id=G-APPTEST&order=after",
    );
    expect(violations).toEqual([]);
});
