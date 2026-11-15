import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { parse } from "yaml";
import { z } from "zod";
import {
    verifyArchive,
    verifyCompatibleChanges,
    verifyDeploymentRevision,
    verifySource,
} from "./browser-diagnostic.mts";

const repository = "RehanSaeed/rehansaeed.github.io";
const run = {
    id: 123,
    path: ".github/workflows/build.yml",
    status: "completed",
    conclusion: "success",
    event: "pull_request",
    head_sha: "a".repeat(40),
    head_repository: { full_name: repository },
};
const artifact = {
    id: 456,
    name: "playwright-site",
    expired: false,
    workflow_run: { id: run.id, head_sha: run.head_sha },
};
const carouselRun = { ...run, run_attempt: 2, conclusion: "failure" };
const generate = {
    name: "Generate",
    run_id: run.id,
    run_attempt: 2,
    head_sha: run.head_sha,
    status: "completed",
    conclusion: "success",
    started_at: "2026-11-15T12:00:00Z",
    completed_at: "2026-11-15T12:05:00Z",
};
const carouselArtifact = {
    ...artifact,
    created_at: "2026-11-15T12:04:00Z",
    digest: `sha256:${"a".repeat(64)}`,
};

await test("carousel permits a failed aggregate only with its exact successful Generate attempt", () => {
    assert.equal(
        verifySource(
            carouselRun,
            carouselArtifact,
            repository,
            "123",
            "carousel",
            generate,
        ).artifact.id,
        artifact.id,
    );
    for (const invalid of [
        { ...generate, conclusion: "failure" },
        { ...generate, conclusion: "cancelled" },
        { ...generate, status: "in_progress" },
        { ...generate, run_id: 124 },
        { ...generate, run_attempt: 1 },
        { ...generate, head_sha: "b".repeat(40) },
        { ...generate, name: "Quality" },
        undefined,
    ]) {
        assert.throws(() =>
            verifySource(
                carouselRun,
                carouselArtifact,
                repository,
                "123",
                "carousel",
                invalid,
            ),
        );
    }
    for (const invalid of [
        { ...carouselRun, status: "in_progress" },
        { ...carouselRun, conclusion: "cancelled" },
        { ...carouselRun, run_attempt: 3 },
    ]) {
        assert.throws(() =>
            verifySource(
                invalid,
                carouselArtifact,
                repository,
                "123",
                "carousel",
                generate,
            ),
        );
    }
});

await test("carousel rejects stale artifacts and mismatched artifact revisions", () => {
    for (const invalid of [
        { ...carouselArtifact, created_at: "2026-11-15T11:59:59Z" },
        { ...carouselArtifact, created_at: "2026-11-15T12:05:01Z" },
        { ...carouselArtifact, digest: "invalid" },
        { ...carouselArtifact, expired: true },
        {
            ...carouselArtifact,
            workflow_run: { id: 124, head_sha: run.head_sha },
        },
        {
            ...carouselArtifact,
            workflow_run: { id: 123, head_sha: "b".repeat(40) },
        },
    ]) {
        assert.throws(() =>
            verifySource(
                carouselRun,
                invalid,
                repository,
                "123",
                "carousel",
                generate,
            ),
        );
    }
    verifyCompatibleChanges(["tests/e2e/image-carousels.spec.ts"], "carousel");
    assert.throws(() => {
        verifyCompatibleChanges(["tests/e2e/image-carousels.spec.ts"]);
    });
    assert.throws(() => {
        verifyCompatibleChanges(
            ["app/components/content/Carousel.vue"],
            "carousel",
        );
    });
});

await test("diagnostics reject fork, failed, unrelated and mismatched artifact sources", () => {
    assert.equal(
        verifySource(run, artifact, repository, "123").artifact.id,
        456,
    );
    for (const invalid of [
        { ...run, head_repository: { full_name: "fork/blog" } },
        { ...run, conclusion: "failure" },
        { ...run, status: "in_progress" },
        { ...run, path: ".github/workflows/other.yml" },
        { ...run, id: 124 },
    ]) {
        assert.throws(() => verifySource(invalid, artifact, repository, "123"));
    }
    for (const invalid of [
        { ...artifact, expired: true },
        { ...artifact, name: "github-pages" },
        { ...artifact, workflow_run: { id: 124, head_sha: run.head_sha } },
        { ...artifact, workflow_run: { id: 123, head_sha: "b".repeat(40) } },
    ]) {
        assert.throws(() => verifySource(run, invalid, repository, "123"));
    }
    assert.throws(() =>
        verifySource(run, artifact, repository, "123; echo unsafe"),
    );
});

await test("artifact compatibility rejects changed application, dependency and generation inputs", () => {
    verifyCompatibleChanges([
        "tests/e2e/post-view-transition.spec.ts",
        ".github/workflows/build.yml",
    ]);
    for (const path of [
        "app/plugins/post-view-transition.client.ts",
        "nuxt.config.ts",
        "package-lock.json",
        "scripts/serve.mts",
        "public/images/hero/example.png",
        "modules/blog-content/index.ts",
        " scripts/browser-diagnostic.mts",
    ]) {
        assert.throws(() => {
            verifyCompatibleChanges([path]);
        }, /incompatible/);
    }
});

await test("deployment marker must identify the exact source or its compatible PR merge", () => {
    const source = "a".repeat(40);
    const merge = "b".repeat(40);
    verifyDeploymentRevision(source, source, "push", []);
    verifyDeploymentRevision(merge, source, "pull_request", [
        source,
        "c".repeat(40),
    ]);
    assert.throws(() => {
        verifyDeploymentRevision(merge, source, "push", [source]);
    });
    assert.throws(() => {
        verifyDeploymentRevision(merge, source, "pull_request", [
            "c".repeat(40),
        ]);
    });
    assert.throws(() => {
        verifyDeploymentRevision("invalid", source, "push", []);
    });
});

await test("site archive rejects traversal, code replacement and links before extraction", () => {
    verifyArchive(
        ["dist/", "dist/index.html", ".data/blog-image-metadata.json"],
        ["drwxr-xr-x directory", "-rw-r--r-- regular"],
    );
    for (const path of [
        "../script.mts",
        "/dist/index.html",
        "dist/../../script.mts",
        "dist\\..\\script.mts",
        "scripts/serve.mts",
        ".data/other.json",
    ]) {
        assert.throws(() => {
            verifyArchive([path], ["-rw-r--r-- regular"]);
        });
    }
    assert.throws(() => {
        verifyArchive([], []);
    });
    assert.throws(() => {
        verifyArchive(["dist/link"], ["lrwxrwxrwx symlink"]);
    });
    assert.throws(() => {
        verifyArchive(["dist/link"], ["hrw-r--r-- hardlink"]);
    });
});

await test("manual diagnostics stay bounded, fixed and separate from production gates", async () => {
    const value: unknown = parse(
        await readFile(
            new URL("../.github/workflows/build.yml", import.meta.url),
            "utf8",
        ),
    );
    const stepSchema = z.object({
        name: z.string(),
        run: z.string().optional(),
        if: z.string().optional(),
        with: z.record(z.string(), z.unknown()).optional(),
    });
    const jobSchema = z.object({
        if: z.string().optional(),
        needs: z.union([z.string(), z.array(z.string())]).optional(),
        "timeout-minutes": z.number().optional(),
        permissions: z.record(z.string(), z.string()).optional(),
        strategy: z
            .object({
                "max-parallel": z.number().optional(),
                matrix: z.object({ browser: z.array(z.string()).optional() }),
            })
            .optional(),
        steps: z.array(stepSchema),
    });
    const workflow = z
        .object({
            on: z.object({
                workflow_dispatch: z.object({
                    inputs: z.record(z.string(), z.unknown()),
                }),
            }),
            jobs: z.record(z.string(), jobSchema),
        })
        .parse(value);
    assert.deepEqual(Object.keys(workflow.on.workflow_dispatch.inputs), [
        "diagnostic_run",
        "diagnostic_case",
    ]);
    const { jobs } = workflow;
    assert.equal(
        jobs.diagnostic.if,
        "github.event_name == 'workflow_dispatch' && inputs.diagnostic_run != '' && inputs.diagnostic_case != 'carousel'",
    );
    assert.deepEqual(jobs.diagnostic.strategy?.matrix.browser, [
        "chrome",
        "firefox",
    ]);
    assert.equal(jobs.diagnostic["timeout-minutes"], 20);
    assert.deepEqual(jobs.diagnostic.permissions, {
        contents: "read",
        actions: "read",
    });
    const command = jobs.diagnostic.steps.find(
        (step) => step.name === "Repeat Fixed Regression Cases",
    )?.run;
    assert(command);
    assert.match(
        command,
        /--repeat-each=10 --retries=0 --workers=1 --max-failures=1 --trace=retain-on-failure/,
    );
    assert.match(
        command,
        /post-view-transition\.spec\.ts tag-view-transition\.spec\.ts/,
    );
    assert.doesNotMatch(command, /inputs\.|--timeout|BASE_URL|--update/);
    assert.deepEqual(jobs.checks.needs, [
        "build",
        "quality",
        "lighthouse",
        "test",
    ]);
    for (const name of ["build", "quality", "checks"]) {
        const condition = jobs[name].if;
        assert(condition);
        assert.match(
            condition,
            /github\.event_name == 'workflow_dispatch' && inputs\.diagnostic_run != ''/,
        );
    }
    const ordinaryRun =
        "(github.event_name != 'pull_request' || !github.event.pull_request.draft)";
    const notDiagnostic =
        "!(github.event_name == 'workflow_dispatch' && inputs.diagnostic_run != '')";
    assert.equal(jobs.build.if, `${ordinaryRun} && ${notDiagnostic}`);
    assert.equal(jobs.quality.if, `${ordinaryRun} && ${notDiagnostic}`);
    assert.equal(
        jobs.checks.if,
        `always() && ${ordinaryRun} && ${notDiagnostic}`,
    );
    assert.equal(
        jobs.test.steps.find((step) => step.name === "Playwright Test")?.run,
        "npx playwright test --project=${{ matrix.browser }} --shard=${{ matrix.shard }}/3 --workers=2",
    );
    assert.equal(
        jobs.deploy.if,
        "github.event_name != 'pull_request' && github.ref == 'refs/heads/main'",
    );
    const upload = jobs.diagnostic.steps.find(
        (step) => step.name === "Upload Diagnostic Evidence",
    );
    assert(upload);
    assert.equal(upload.if, "always()");
    assert.equal(upload.with?.["retention-days"], 7);
    const carousel = jobs["carousel-diagnostic"];
    assert.equal(
        carousel.if,
        "github.event_name == 'workflow_dispatch' && inputs.diagnostic_run != '' && inputs.diagnostic_case == 'carousel'",
    );
    assert.deepEqual(carousel.strategy?.matrix.browser, [
        "chrome",
        "edge",
        "firefox",
    ]);
    assert.equal(carousel.strategy?.["max-parallel"], 1);
    assert.equal(carousel["timeout-minutes"], 20);
    const carouselCommand = carousel.steps.find(
        (step) => step.name === "Repeat Fixed Carousel Cases",
    )?.run;
    assert(carouselCommand);
    assert.match(
        carouselCommand,
        /--repeat-each=10 --retries=0 --workers=1 --max-failures=1 --trace=retain-on-failure/,
    );
    assert.match(carouselCommand, /playwright test image-carousels\.spec\.ts/);
    assert.doesNotMatch(
        carouselCommand,
        /inputs\.|--timeout|BASE_URL|--update/,
    );
    const grep = /--grep '([^']+)'/.exec(carouselCommand)?.[1];
    assert(grep);
    const spec = await readFile(
        new URL("../tests/e2e/image-carousels.spec.ts", import.meta.url),
        "utf8",
    );
    const titles = Array.from(
        spec.matchAll(/test\("([^"]+)"/g),
        (match) => match[1],
    );
    assert.equal(
        titles.filter((title) => new RegExp(grep).test(title)).length,
        2,
    );
    assert.equal(
        carousel.steps.find(
            (step) => step.name === "Download Digest-Verified Browser Site",
        )?.run,
        "node scripts/browser-diagnostic.mts download",
    );
    const carouselUpload = carousel.steps.find(
        (step) => step.name === "Upload Carousel Diagnostic Evidence",
    );
    assert(carouselUpload);
    assert.equal(carouselUpload.if, "always()");
    assert.equal(carouselUpload.with?.["retention-days"], 7);
});
