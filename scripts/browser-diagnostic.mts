import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFile, cp, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";

const revisionSchema = z.string().regex(/^[a-f0-9]{40}$/);
const runIdSchema = z.string().regex(/^[1-9]\d{0,14}$/);
const runSchema = z.object({
    id: z.number().int().positive(),
    path: z.literal(".github/workflows/build.yml"),
    status: z.literal("completed"),
    conclusion: z.literal("success"),
    event: z.enum(["push", "pull_request", "schedule", "workflow_dispatch"]),
    head_sha: revisionSchema,
    head_repository: z.object({ full_name: z.string() }),
});
const artifactSchema = z.object({
    id: z.number().int().positive(),
    name: z.literal("playwright-site"),
    expired: z.literal(false),
    workflow_run: z.object({
        id: z.number().int().positive(),
        head_sha: revisionSchema,
    }),
});

// Only test observations and this diagnostic's implementation may differ.
const compatibleChanges = new Set([
    ".github/workflows/build.yml",
    "scripts/browser-diagnostic.mts",
    "scripts/browser-diagnostic.test.mts",
    "tests/e2e/history-probe.ts",
    "tests/e2e/post-view-transition.spec.ts",
    "tests/e2e/tag-view-transition.spec.ts",
    "tests/e2e/video-autoplay.spec.ts",
]);

export const verifySource = (
    runValue: unknown,
    artifactValue: unknown,
    repository: string,
    runId: string,
) => {
    const run = runSchema.parse(runValue);
    const artifact = artifactSchema.parse(artifactValue);
    assert.equal(String(run.id), runIdSchema.parse(runId));
    assert.equal(run.head_repository.full_name, repository);
    assert.equal(artifact.workflow_run.id, run.id);
    assert.equal(artifact.workflow_run.head_sha, run.head_sha);
    return { run, artifact };
};

export const verifyCompatibleChanges = (paths: string[]) => {
    for (const path of paths) {
        assert(
            compatibleChanges.has(path),
            `Generated artifact is incompatible with changed input: ${path}`,
        );
    }
};

export const verifyArchive = (names: string[], entries: string[]) => {
    assert(names.length > 0, "Empty browser-site archive.");
    for (const name of names) {
        assert(
            (name === "dist/" ||
                name.startsWith("dist/") ||
                name === ".data/blog-image-metadata.json") &&
                !name.includes("\\") &&
                !name.split("/").includes(".."),
            `Unexpected archive member: ${name}`,
        );
    }
    assert(
        entries.every(
            (entry) => entry.startsWith("-") || entry.startsWith("d"),
        ),
        "Browser-site archive must contain only regular files and directories.",
    );
};

export const verifyDeploymentRevision = (
    revision: string,
    source: string,
    event: string,
    parents: string[],
) => {
    revisionSchema.parse(revision);
    revisionSchema.parse(source);
    if (revision !== source) {
        assert.equal(event, "pull_request", "Unexpected deployment revision.");
        assert(
            parents.includes(source),
            "Deployment revision is not the source PR's merge commit.",
        );
    }
};

const git = (...args: string[]) =>
    execFileSync("git", args, {
        encoding: "utf8",
        maxBuffer: 8 * 1024 * 1024,
    });
const compare = (source: string, target: string) => {
    verifyCompatibleChanges(
        git("diff", "--name-only", "-z", source, target)
            .split("\0")
            .filter(Boolean),
    );
};
const fetchRevision = (revision: string) => {
    execFileSync("git", [
        "fetch",
        "--no-tags",
        "--depth=2",
        "origin",
        revisionSchema.parse(revision),
    ]);
};
const output = async (values: Record<string, string>) => {
    assert(process.env.GITHUB_OUTPUT, "GITHUB_OUTPUT is required.");
    await appendFile(
        process.env.GITHUB_OUTPUT,
        Object.entries(values)
            .map(([key, value]) => `${key}=${value}\n`)
            .join(""),
    );
};
const prepare = async () => {
    const runId = runIdSchema.parse(process.env.DIAGNOSTIC_RUN);
    const repository = z
        .string()
        .regex(/^[\w.-]+\/[\w.-]+$/)
        .parse(process.env.GITHUB_REPOSITORY);
    const token = z.string().min(1).parse(process.env.GH_TOKEN);
    const api = async (path: string): Promise<unknown> => {
        const response = await fetch(
            `https://api.github.com/repos/${repository}/${path}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            },
        );
        assert(response.ok, `GitHub ${path}: HTTP ${response.status}`);
        return response.json();
    };
    const runValue = await api(`actions/runs/${runId}`);
    const listing = z
        .object({
            total_count: z.number().int().max(100),
            artifacts: z.array(
                z.object({ id: z.number().int().positive(), name: z.string() }),
            ),
        })
        .parse(await api(`actions/runs/${runId}/artifacts?per_page=100`));
    const matches = listing.artifacts.filter(
        (artifact) => artifact.name === "playwright-site",
    );
    assert.equal(
        matches.length,
        1,
        "Expected exactly one playwright-site artifact.",
    );
    const { run, artifact } = verifySource(
        runValue,
        await api(`actions/artifacts/${matches[0].id}`),
        repository,
        runId,
    );
    fetchRevision(run.head_sha);
    compare(run.head_sha, "HEAD");
    const lock: unknown = JSON.parse(
        await readFile("package-lock.json", "utf8"),
    );
    const version = z
        .object({
            packages: z.object({
                "node_modules/playwright": z.object({
                    version: z.string().regex(/^\d+\.\d+\.\d+$/),
                }),
            }),
        })
        .parse(lock).packages["node_modules/playwright"].version;
    await output({
        "artifact-id": String(artifact.id),
        "source-sha": run.head_sha,
        "source-event": run.event,
        "playwright-image": `mcr.microsoft.com/playwright:v${version}-noble`,
    });
    console.log(`Validated artifact ${artifact.id}, source ${run.head_sha}.`);
};

const extract = async () => {
    const source = revisionSchema.parse(process.env.DIAGNOSTIC_SOURCE_SHA);
    const event = runSchema.shape.event.parse(
        process.env.DIAGNOSTIC_SOURCE_EVENT,
    );
    const archive = join(
        z.string().min(1).parse(process.env.RUNNER_TEMP),
        "diagnostic-artifact",
        "playwright-site.tar",
    );
    const tar = (flag: string) =>
        execFileSync("tar", [flag, archive], {
            encoding: "utf8",
            maxBuffer: 8 * 1024 * 1024,
        })
            .trim()
            .split(/\r?\n/);
    verifyArchive(tar("-tf"), tar("-tvf"));
    const directory = await mkdtemp(join(tmpdir(), "browser-diagnostic-"));
    execFileSync("tar", ["-xf", archive, "-C", directory]);
    const deployment: unknown = JSON.parse(
        await readFile(join(directory, "dist", "deployment.json"), "utf8"),
    );
    const { revision } = z
        .object({ revision: revisionSchema })
        .parse(deployment);
    fetchRevision(source);
    fetchRevision(revision);
    verifyDeploymentRevision(
        revision,
        source,
        event,
        git("show", "-s", "--format=%P", revision).trim().split(" "),
    );
    compare(source, revision);
    compare(revision, "HEAD");
    await cp(join(directory, "dist"), "dist", {
        recursive: true,
        errorOnExist: true,
        force: false,
    });
    await cp(join(directory, ".data"), ".data", {
        recursive: true,
        errorOnExist: true,
        force: false,
    });
    console.log(
        `Verified generated revision ${revision}; no application inputs differ.`,
    );
};

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const mode = z.enum(["prepare", "extract"]).parse(process.argv[2]);
    await (mode === "prepare" ? prepare() : extract());
}
