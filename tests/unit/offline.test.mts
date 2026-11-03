import assert from "node:assert/strict";
import test from "node:test";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
    offlineCandidates,
    offlineEntrySchema,
    offlineIntegrity,
    offlineKey,
    offlineMessageSchema,
    offlineStateSchema,
    offlineStatusSchema,
} from "../../shared/utils/offline.ts";
import { z } from "zod";

void test("final offline manifest uses deployed bytes and preserves revisioned and fingerprinted keys", async () => {
    const directory = await mkdtemp(join(tmpdir(), "offline-manifest-"));
    try {
        await mkdir(join(directory, "dist"));
        const entries = [
            { integrity: "sha256-before", revision: "before", url: "/" },
            { integrity: "sha256-before", revision: null, url: "chunk.js" },
        ];
        await writeFile(
            join(directory, "dist", "index.html"),
            "final metadata",
        );
        await writeFile(join(directory, "dist", "chunk.js"), "fingerprinted");
        await mkdir(join(directory, "dist", "_nuxt"));
        await writeFile(
            join(directory, "dist", "_nuxt", "sqlite3.test.wasm"),
            new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]),
        );
        for (const collection of ["posts", "portfolio"]) {
            const path = join(directory, "dist", "__nuxt_content", collection);
            await mkdir(path, { recursive: true });
            await writeFile(
                join(path, "sql_dump.txt"),
                `${collection} database`,
            );
        }
        await writeFile(
            join(directory, "dist", "service-worker.js"),
            `const assets = ${JSON.stringify(entries)};`,
        );
        await promisify(execFile)(
            process.execPath,
            [
                fileURLToPath(
                    new URL(
                        "../../scripts/offline-manifest.mjs",
                        import.meta.url,
                    ),
                ),
            ],
            { cwd: directory },
        );
        const worker = await readFile(
            join(directory, "dist", "service-worker.js"),
            "utf8",
        );
        const updated = z
            .array(offlineEntrySchema)
            .parse(JSON.parse(worker.slice("const assets = ".length, -1)));
        assert.deepEqual(
            updated.slice(0, 2).map(({ url }) => url),
            ["/", "chunk.js"],
        );
        assert.deepEqual(
            new Set(updated.map(({ url }) => url)),
            new Set([
                "/",
                "chunk.js",
                "_nuxt/sqlite3.test.wasm",
                "__nuxt_content/posts/sql_dump.txt",
                "__nuxt_content/portfolio/sql_dump.txt",
            ]),
        );
        assert.equal(
            updated[0]?.revision,
            createHash("md5").update("final metadata").digest("hex"),
        );
        assert.equal(updated[1]?.revision, null);
        assert.equal(
            updated.find(({ url }) => url.endsWith(".wasm"))?.revision,
            null,
        );
        const posts = updated.find(
            ({ url }) => url === "__nuxt_content/posts/sql_dump.txt",
        );
        assert.ok(posts);
        assert.equal(
            posts.revision,
            createHash("md5").update("posts database").digest("hex"),
        );
        assert.equal(
            await offlineIntegrity(
                new Response("posts database"),
                posts.integrity,
            ),
            true,
        );
        assert.equal(
            await offlineIntegrity(
                new Response("final metadata"),
                updated[0].integrity,
            ),
            true,
        );
        assert.equal(
            await offlineIntegrity(
                new Response("fingerprinted"),
                updated[1].integrity,
            ),
            true,
        );
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

void test("offline URLs preserve supported query normalisation and directory indexes", () => {
    assert.deepEqual(
        offlineCandidates(
            "https://example.com/post/?utm_source=test&_b=1&v=2#title",
        ),
        ["https://example.com/post/", "https://example.com/post/index.html"],
    );
    assert.deepEqual(offlineCandidates("https://example.com/post"), [
        "https://example.com/post",
        "https://example.com/post/",
    ]);
    assert.deepEqual(offlineCandidates("https://example.com/?category=CSS"), [
        "https://example.com/?category=CSS",
        "https://example.com/index.html?category=CSS",
    ]);
});

void test("offline cache keys retain Workbox revision semantics", () => {
    assert.equal(
        offlineKey(
            { url: "post/", revision: "abc", integrity: "sha256-test" },
            "https://example.com",
        ),
        "https://example.com/post/?__WB_REVISION__=abc",
    );
    assert.equal(
        offlineKey(
            { url: "_nuxt/chunk.js", revision: null, integrity: "sha256-test" },
            "https://example.com",
        ),
        "https://example.com/_nuxt/chunk.js",
    );
});

void test("asset integrity rejects a successful response from the wrong deployment", async () => {
    const integrity = "sha256-LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=";
    assert.equal(
        await offlineIntegrity(new Response("hello"), integrity),
        true,
    );
    assert.equal(
        await offlineIntegrity(new Response("new deployment"), integrity),
        false,
    );
});

void test("persisted state and worker replies reject corrupt external data", () => {
    assert.deepEqual(offlineStateSchema.parse({}), {});
    assert.equal(
        offlineStateSchema.safeParse({ active: { id: "x" } }).success,
        false,
    );
    assert.equal(offlineStatusSchema.safeParse({ ready: true }).success, false);
    assert.equal(offlineMessageSchema.safeParse("start").success, false);
    assert.deepEqual(
        offlineMessageSchema.parse({
            command: "start",
            buildIntegrity: "sha256-version",
        }),
        {
            command: "start",
            buildIntegrity: "sha256-version",
        },
    );
});
