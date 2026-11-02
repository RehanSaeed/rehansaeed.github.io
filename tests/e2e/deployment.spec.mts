import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { expect, test, type Route } from "@playwright/test";
import { z } from "zod";
import { requestUrl, workflowSchema } from "./data";
import {
    checkCsp,
    checkPagesSettings,
    verifyArtifact,
    verifyPublished,
} from "../../scripts/pages.mjs";

const deploymentStepSchema =
    workflowSchema.shape.jobs.valueType.shape.steps.element.extend({
        if: z.string().optional(),
        run: z.string().optional(),
    });
const deploymentJobSchema = workflowSchema.shape.jobs.valueType.extend({
    name: z.string().optional(),
    needs: z.union([z.string(), z.array(z.string())]).optional(),
    environment: z.looseObject({ name: z.string() }).optional(),
    concurrency: z
        .looseObject({ "cancel-in-progress": z.boolean().optional() })
        .optional(),
    steps: z.array(deploymentStepSchema),
});
const deploymentWorkflowSchema = workflowSchema.extend({
    permissions: z.record(z.string(), z.string()),
    jobs: z.record(z.string(), deploymentJobSchema),
});

function readBuildWorkflow() {
    return deploymentWorkflowSchema.parse(
        parse(readFileSync(".github/workflows/build.yml", "utf8")),
    );
}

function requireJob(
    workflow: z.infer<typeof deploymentWorkflowSchema>,
    name: string,
) {
    const job = workflow.jobs[name];
    if (!job) {
        throw new Error(`Missing workflow job: ${name}`);
    }
    return job;
}

function requireStep(
    steps: z.infer<typeof deploymentStepSchema>[],
    name: string,
) {
    const step = steps.find((candidate) => candidate.name === name);
    if (!step) {
        throw new Error(`Missing workflow step: ${name}`);
    }
    return step;
}

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
    expect(() => {
        checkPagesSettings({ build_type: "legacy", cname: "rehansaeed.com" });
    }).toThrow("Switch Settings");
    expect(() => {
        checkPagesSettings({ build_type: "workflow", cname: null });
    }).toThrow("custom domain");
    expect(() => {
        checkPagesSettings({ build_type: "workflow", cname: "rehansaeed.com" });
    }).not.toThrow();
});

test("GA4 requires both vendor scripts and regional collection origins in every enforced policy", () => {
    expect(() => {
        checkCsp([oldPolicy], "");
    }).not.toThrow();
    expect(() => {
        checkCsp([oldPolicy], "G-LOCALTEST");
    }).toThrow("googletagmanager");
    const scriptsOnly = oldPolicy.replace(
        "script-src 'self'",
        "script-src 'self' https://www.googletagmanager.com",
    );
    expect(() => {
        checkCsp([scriptsOnly], "G-LOCALTEST");
    }).toThrow("connect-src");
    expect(() => {
        checkCsp([policy], "G-LOCALTEST");
    }).not.toThrow();
    expect(() => {
        checkCsp([policy, oldPolicy], "G-LOCALTEST");
    }).toThrow();
    expect(() => {
        checkCsp([`${policy}; script-src-elem 'none'`], "G-LOCALTEST");
    }).toThrow();
    expect(() => {
        checkCsp(["default-src 'self'"], "G-LOCALTEST");
    }).toThrow();
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

test("Image compression automation is removed while CI still checks Git LFS pointers", () => {
    const workflows = ".github/workflows";
    const files = readdirSync(workflows);
    expect(files).not.toContain("compress-images.yml");
    expect(files).not.toContain("compress-images-on-demand.yml");
    for (const file of files.filter((file) => /\.ya?ml$/.test(file))) {
        expect(readFileSync(join(workflows, file), "utf8"), file).not.toContain(
            "calibreapp/image-actions@",
        );
    }
    const build = requireJob(readBuildWorkflow(), "build");
    expect(requireStep(build.steps, "Check Git LFS Pointers").run).toBe(
        "git lfs fsck --pointers",
    );
});

test("Deployment is main-only, gated by successful build/tests/preflight and preserves hidden public files", () => {
    const workflow = readBuildWorkflow();
    const deploy = requireJob(workflow, "deploy");
    const build = requireJob(workflow, "build");
    const condition =
        "github.event_name != 'pull_request' && github.ref == 'refs/heads/main'";
    expect(deploy.if).toBe(condition);
    expect(deploy.needs).toEqual(["build", "test"]);
    expect(deploy.permissions).toEqual({
        contents: "read",
        pages: "write",
        "id-token": "write",
    });
    expect(deploy.environment?.name).toBe("github-pages");
    expect(deploy.concurrency?.["cancel-in-progress"]).toBe(false);
    const steps = build.steps;
    const check = steps.findIndex(
        (step) => step.name === "Check Pages Cutover",
    );
    const upload = steps.findIndex(
        (step) => step.name === "Upload Pages Artifact",
    );
    expect(check).toBeGreaterThan(-1);
    expect(check).toBeLessThan(upload);
    expect(steps[check]?.if).toBe(condition);
    expect(steps[upload]?.if).toBe(condition);
    expect(steps[upload]?.with).toEqual({
        path: "dist",
        "include-hidden-files": true,
    });
    expect(workflow.permissions.pages).toBe("read");
    const deployment = deploy.steps;
    expect(
        deployment.some((step) => step.name === "Verify Published Site"),
    ).toBe(true);
    expect(deployment.some((step) => step.run?.includes("npm ci"))).toBe(false);
});

test("Browser suites run in parallel against one complete build without dropping coverage", () => {
    const workflow = readBuildWorkflow();
    const build = requireJob(workflow, "build");
    const browserTests = requireJob(workflow, "test");
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
    const upload = requireStep(build.steps, "Upload Browser Test Site");
    const download = requireStep(
        browserTests.steps,
        "Download Browser Test Site",
    );
    expect(upload.with?.name).toBe("playwright-site");
    expect(upload.with?.path).toBe("playwright-site.tar");
    expect(upload.with?.["if-no-files-found"]).toBe("error");
    expect(download.with?.name).toBe(upload.with?.name);
    const steps = browserTests.steps;
    const extract = steps.findIndex(
        (step) => step.name === "Extract Browser Test Site",
    );
    const run = steps.findIndex((step) => step.name === "Playwright Test");
    expect(extract).toBeGreaterThan(
        steps.findIndex((step) => step.name === "NPM Install"),
    );
    expect(extract).toBeLessThan(run);
    expect(steps[extract]?.run).toBe("tar -xf playwright-site.tar");
    expect(steps[run]?.run).toBe(
        "npx playwright test --project=${{ matrix.browser }}",
    );
    expect(steps.some((step) => step.run === "npm run build")).toBe(false);
    for (const name of [
        "Cache Playwright Browsers",
        "Install Playwright Browsers",
        "Install Playwright Dependencies",
    ]) {
        expect(requireStep(steps, name).if).toContain(
            "matrix.browser == 'firefox'",
        );
    }
    const report = requireStep(steps, "Upload Playwright Report");
    expect(report.if).toBe("failure()");
    expect(report.with?.name).toBe("playwright-report-${{ matrix.browser }}");
});

function publishedProbeResponse(
    input: RequestInfo | URL,
    state: { revision: string; body: string; html: string; status: number },
): Promise<Response> {
    const url = requestUrl(input);
    return Promise.resolve(
        url.endsWith("/deployment.json")
            ? Response.json({ revision: state.revision })
            : new Response(url.endsWith("/") ? state.html : state.body, {
                  status: state.status,
              }),
    );
}

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
        globalThis.fetch = (url) =>
            publishedProbeResponse(url, { revision, body, html, status });
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

async function handleGa4Probe(
    route: Route,
    requests: string[],
    loaderRequests: string[],
) {
    const url = new URL(route.request().url());
    if (
        [
            "www.googletagmanager.com",
            "region1.google-analytics.com",
            "www.google.com",
        ].includes(url.hostname)
    ) {
        // Keep the explicit probes separate from the app's configured GA4 loader.
        if (url.searchParams.has("csp-probe")) {
            requests.push(url.hostname);
        } else {
            loaderRequests.push(url.href);
        }
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
}

test("GA4 vendor and collector loads pass the corrected CSP without sending tracking data", async ({
    page,
}) => {
    const requests: string[] = [];
    const loaderRequests: string[] = [];
    await page.route("**/*", (route) =>
        handleGa4Probe(route, requests, loaderRequests),
    );
    const violations: string[] = [];
    page.on("console", (message) => {
        if (/content security policy/i.test(message.text())) {
            violations.push(message.text());
        }
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
                script.onload = () => {
                    resolve();
                };
                script.onerror = () => {
                    reject(new Error("Vendor blocked"));
                };
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
