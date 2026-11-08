import assert from "node:assert/strict";
import { execFile, fork } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Socket } from "node:net";
import { once } from "node:events";
import { test, type TestContext } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";
import { z } from "zod";
import { startPreviewServer } from "./preview-server.mts";
import { verifyPublished } from "./pages.mts";

const execute = promisify(execFile);
const script = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const temporaryDirectory = async (context: TestContext) => {
    const directory = await mkdtemp(join(tmpdir(), "blog-scripts-"));
    context.after(() => rm(directory, { recursive: true, force: true }));
    return directory;
};

const observeConnectionClosure = (
    connection: Socket,
    isDisconnecting: () => boolean,
) =>
    new Promise<Error[]>((resolve) => {
        const unexpectedErrors: Error[] = [];
        connection.on("error", (error: Error) => {
            // Closing an owned server can reset its incomplete HTTP requests.
            if (
                !isDisconnecting() ||
                !("code" in error) ||
                error.code !== "ECONNRESET"
            ) {
                unexpectedErrors.push(error);
            }
        });
        connection.once("close", () => {
            resolve(unexpectedErrors);
        });
    });

for (const [code, disconnecting] of [
    ["ECONNRESET", true],
    ["ECONNRESET", false],
    ["EPIPE", true],
    [undefined, true],
    [undefined, false],
] as const) {
    await test(`preview connection observer preserves unexpected errors (${code ?? "no code"}, disconnecting=${disconnecting})`, async (context) => {
        const connection = new Socket();
        context.after(() => connection.destroy());
        const closed = observeConnectionClosure(
            connection,
            () => disconnecting,
        );
        const error = Object.assign(new Error("Injected socket failure"), {
            code,
        });
        connection.destroy(error);
        assert.deepEqual(
            await closed,
            code === "ECONNRESET" && disconnecting ? [] : [error],
        );
    });
}

await test("preview connection observer preserves an early reset after teardown starts", async (context) => {
    const connection = new Socket();
    context.after(() => connection.destroy());
    let disconnecting = false;
    const closed = observeConnectionClosure(connection, () => disconnecting);
    const error = Object.assign(new Error("Early socket reset"), {
        code: "ECONNRESET",
    });
    const errored = once(connection, "error");
    connection.destroy(error);
    await errored;
    disconnecting = true;
    assert.deepEqual(await closed, [error]);
});

await test("preview connection observer accepts a clean close", async (context) => {
    const connection = new Socket();
    context.after(() => connection.destroy());
    const closed = observeConnectionClosure(connection, () => true);
    connection.destroy();
    assert.deepEqual(await closed, []);
});

await test("AVIF CLI prefers a same-basename PNG, preserves alpha and dimensions and supports empty trees", async (context) => {
    const directory = await temporaryDirectory(context);
    await Promise.all(
        ["public", "content"].map((name) => mkdir(join(directory, name))),
    );
    const command = script("./avif-images.mts");
    const empty = await execute(process.execPath, [command], {
        cwd: directory,
    });
    assert.match(empty.stdout, /AVIF: 0 bytes; originals: 0 bytes/);
    const png = await sharp({
        create: { width: 8, height: 6, channels: 4, background: "#D9A74A80" },
    })
        .png()
        .toBuffer();
    await writeFile(join(directory, "public", "shared.png"), png);
    await sharp({
        create: { width: 12, height: 10, channels: 3, background: "#243B5A" },
    })
        .jpeg()
        .toFile(join(directory, "public", "shared.jpg"));
    await execute(process.execPath, [command], { cwd: directory });
    const output = await sharp(
        join(directory, "public", "shared.avif"),
    ).metadata();
    assert.equal(output.width, 8);
    assert.equal(output.height, 6);
    assert.equal(output.hasAlpha, true);
    await writeFile(join(directory, "content", "unsupported.jpeg"), png);
    await assert.rejects(
        execute(process.execPath, [command], { cwd: directory }),
        /Use .jpg rather than .jpeg/,
    );
});

await test("snapshot CLI rejects invalid concurrency before reading files or writing output", async (context) => {
    const directory = await temporaryDirectory(context);
    for (const concurrency of [
        "0",
        "-1",
        "1.5",
        "NaN",
        "invalid",
        "Infinity",
    ]) {
        await assert.rejects(
            execute(
                process.execPath,
                [
                    script("./parity/snapshot.mts"),
                    `--concurrency=${concurrency}`,
                ],
                { cwd: directory },
            ),
            /ZodError/,
        );
    }
    await assert.rejects(
        readFile(join(directory, ".parity", "local", "pages.json")),
        { code: "ENOENT" },
    );
});

await test("snapshot CLI captures pages with valid concurrency and reports non-200 pages", async (context) => {
    const directory = await temporaryDirectory(context);
    let malformedFeed = false;
    const server = createServer((request, response) => {
        const path = request.url;
        if (path === "/feed.json") {
            response.end(
                JSON.stringify({
                    version: "1",
                    title: "Blog",
                    home_page_url: "http://localhost",
                    feed_url: "http://localhost/feed.json",
                    ...(malformedFeed ? {} : { items: [] }),
                }),
            );
        } else if (path === "/manifest.webmanifest") {
            response.end("{}");
        } else {
            response.writeHead(
                path === "/missing/" || path === "/this-does-not-exist/"
                    ? 404
                    : 200,
            );
            response.end(
                '<html lang="en"><head><title>Fixture</title></head><body><h1>Page</h1></body></html>',
            );
        }
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    context.after(
        () =>
            new Promise<void>((resolve, reject) =>
                server.close((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                }),
            ),
    );
    const address = server.address();
    assert(address && typeof address !== "string");
    await writeFile(join(directory, "urls.txt"), "/\n/missing/\n");
    const result = await execute(
        process.execPath,
        [
            script("./parity/snapshot.mts"),
            "--base",
            `http://127.0.0.1:${address.port}`,
            "--urls",
            "urls.txt",
            "--out",
            "snapshot",
            "--concurrency",
            "2",
        ],
        { cwd: directory },
    );
    const pages: unknown = JSON.parse(
        await readFile(join(directory, "snapshot", "pages.json"), "utf8"),
    );
    assert.deepEqual(pages, {
        "/": {
            status: 200,
            lang: "en",
            title: "Fixture",
            meta: {},
            links: {},
            jsonLd: [],
            h1: ["Page"],
            cards: [],
        },
        "/missing/": { status: 404, location: null },
    });
    assert.match(result.stdout, /1 non-200 pages/);
    malformedFeed = true;
    await execute(
        process.execPath,
        [
            script("./parity/snapshot.mts"),
            "--base",
            `http://127.0.0.1:${address.port}`,
            "--urls",
            "urls.txt",
            "--out",
            "snapshot",
        ],
        { cwd: directory },
    );
    const artifacts: unknown = JSON.parse(
        await readFile(join(directory, "snapshot", "artifacts.json"), "utf8"),
    );
    const failure = z
        .object({
            "/feed.json": z.object({
                status: z.literal(200),
                error: z.string(),
            }),
        })
        .parse(artifacts);
    assert.match(failure["/feed.json"].error, /items/);
});

await test("diff CLI preserves ignored fields and difference exit codes and rejects non-object snapshots", async (context) => {
    const directory = await temporaryDirectory(context);
    await Promise.all(
        ["expected", "actual"].map((name) => mkdir(join(directory, name))),
    );
    for (const name of ["expected", "actual"]) {
        await writeFile(join(directory, name, "artifacts.json"), "{}");
        await writeFile(
            join(directory, name, "pages.json"),
            JSON.stringify({
                "/": { title: "Blog", meta: { generator: name } },
            }),
        );
    }
    const args = [script("./parity/diff.mts"), "expected", "actual"];
    const match = await execute(process.execPath, args, { cwd: directory });
    assert.match(match.stdout, /0 difference\(s\)/);
    await writeFile(
        join(directory, "actual", "pages.json"),
        JSON.stringify({ "/": { title: "Changed" } }),
    );
    await assert.rejects(
        execute(process.execPath, args, { cwd: directory }),
        (error: unknown) => {
            assert(
                error instanceof Error && "code" in error && "stdout" in error,
            );
            assert.equal(error.code, 1);
            assert.match(String(error.stdout), /\.title/);
            return true;
        },
    );
    await writeFile(join(directory, "actual", "pages.json"), "[]");
    await assert.rejects(
        execute(process.execPath, args, { cwd: directory }),
        /ZodError/,
    );
});

await test("shared preview lifecycle serves static files and shuts down idempotently", async (context) => {
    const directory = await temporaryDirectory(context);
    await Promise.all([
        writeFile(join(directory, "index.html"), "Preview"),
        writeFile(join(directory, "404.html"), "Not found"),
    ]);
    const reservation = createServer();
    reservation.listen(0, "127.0.0.1");
    await once(reservation, "listening");
    const address = reservation.address();
    assert(address && typeof address !== "string");
    await new Promise<void>((resolve) =>
        reservation.close(() => {
            resolve();
        }),
    );
    const stop = await startPreviewServer(directory, String(address.port));
    context.after(stop);
    const url = `http://localhost:${address.port}`;
    assert.equal(await (await fetch(url)).text(), "Preview");
    const head = await fetch(url, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("content-length"), "7");
    assert.equal(await head.text(), "");
    assert.equal((await fetch(`${url}/missing/`)).status, 404);
    assert.equal((await fetch(url, { method: "POST" })).status, 405);
    await stop();
    await stop();
    await assert.rejects(fetch(url));
});

await test("shared preview lifecycle rejects a server that exits before readiness", async (context) => {
    const directory = await temporaryDirectory(context);
    await assert.rejects(
        startPreviewServer(directory, "0"),
        /exited before readiness/,
    );
});

for (const disconnectBeforeReadiness of [false, true]) {
    await test(`owned preview exits when its parent's IPC connection closes ${disconnectBeforeReadiness ? "before readiness" : "with open HTTP connections"}`, async (context) => {
        const directory = await temporaryDirectory(context);
        await Promise.all([
            writeFile(join(directory, "index.html"), "Preview"),
            writeFile(join(directory, "404.html"), "Not found"),
        ]);
        const reservation = createServer();
        reservation.listen(0, "127.0.0.1");
        await once(reservation, "listening");
        const address = reservation.address();
        assert(address && typeof address !== "string");
        await new Promise<void>((resolve, reject) =>
            reservation.close((error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            }),
        );
        const server = fork(script("./serve.mts"), [directory], {
            env: { ...process.env, PORT: String(address.port) },
            silent: true,
        });
        context.after(async () => {
            if (server.exitCode === null && server.signalCode === null) {
                const exited = once(server, "exit", {
                    signal: AbortSignal.timeout(5000),
                });
                assert(
                    server.kill(),
                    "Could not stop the owned preview process.",
                );
                await exited;
            }
        });
        let errors = "";
        server.stderr!.on("data", (chunk: Buffer) => {
            errors += chunk.toString();
        });
        const url = `http://127.0.0.1:${address.port}`;
        let disconnecting = false;
        let connectionClosed: Promise<Error[]> | undefined;
        if (!disconnectBeforeReadiness) {
            await once(server.stdout!, "data", {
                signal: AbortSignal.timeout(5000),
            });
            assert.equal(await (await fetch(url)).text(), "Preview");
            const connection = new Socket();
            context.after(() => connection.destroy());
            connectionClosed = observeConnectionClosure(
                connection,
                () => disconnecting,
            );
            const connected = once(connection, "connect", {
                signal: AbortSignal.timeout(5000),
            });
            connection.connect(address.port, "127.0.0.1");
            await connected;
            connection.resume();
            connection.write("GET / HTTP/1.1\r\nHost: localhost\r\n");
        }
        const exited = once(server, "exit", {
            signal: AbortSignal.timeout(5000),
        });
        disconnecting = true;
        server.disconnect();
        assert.deepEqual(await exited, [0, null]);
        if (connectionClosed) {
            assert.deepEqual(await connectionClosed, []);
        }
        assert.equal(errors, "");
        await assert.rejects(fetch(url));
    });
}

await test("Pages verification rejects malformed local markers and invalid attempt counts", async (context) => {
    const directory = await temporaryDirectory(context);
    await mkdir(join(directory, "dist"));
    await writeFile(
        join(directory, "dist", "deployment.json"),
        JSON.stringify({
            revision: "a".repeat(40),
            files: [{ path: "/", status: 200, contains: [] }],
        }),
    );
    await assert.rejects(
        execute(process.execPath, [script("./pages.mts"), "verify"], {
            cwd: directory,
        }),
        /Deployment HTML must have nonempty verification signals/,
    );
    for (const attempts of [0, -1, 1.5]) {
        await assert.rejects(
            verifyPublished(
                "http://localhost",
                { revision: "a".repeat(40), files: [] },
                attempts,
            ),
            /positive integer attempt count/,
        );
    }
    await assert.rejects(
        verifyPublished(
            "http://localhost",
            { revision: "a".repeat(40), files: [] },
            1,
        ),
        /Deployment must verify at least one resource/,
    );
});

await test("Pages verification rejects malformed remote deployment markers", async (context) => {
    context.mock.method(globalThis, "fetch", () =>
        Promise.resolve(Response.json({ revision: 42 })),
    );
    await assert.rejects(
        verifyPublished(
            "http://localhost",
            {
                revision: "a".repeat(40),
                files: [{ path: "/", status: 200, contains: ["<main"] }],
            },
            1,
        ),
        /Invalid deployment revision/,
    );
});

await test("Pages verification CLI works without installed dependencies", async (context) => {
    const directory = await temporaryDirectory(context);
    await Promise.all([
        mkdir(join(directory, "scripts")),
        mkdir(join(directory, "dist")),
    ]);
    await Promise.all([
        writeFile(
            join(directory, "scripts", "pages.mts"),
            await readFile(script("./pages.mts")),
        ),
        writeFile(
            join(directory, "site.json"),
            await readFile(script("../site.json")),
        ),
    ]);
    const revision = "a".repeat(40);
    await writeFile(
        join(directory, "dist", "deployment.json"),
        JSON.stringify({
            revision,
            files: [
                {
                    path: "/service-worker.js",
                    status: 200,
                    sha256: createHash("sha256")
                        .update("compiled")
                        .digest("hex"),
                },
            ],
        }),
    );
    const server = createServer((request, response) => {
        response.end(
            request.url === "/deployment.json"
                ? JSON.stringify({ revision })
                : "compiled",
        );
    });
    server.listen(0, "127.0.0.1");
    context.after(
        () =>
            new Promise<void>((resolve) =>
                server.close(() => {
                    resolve();
                }),
            ),
    );
    await once(server, "listening");
    const address = server.address();
    assert(address && typeof address !== "string");
    const result = await execute(
        process.execPath,
        [join(directory, "scripts", "pages.mts"), "verify"],
        {
            cwd: directory,
            env: {
                ...process.env,
                BASE_URL: `http://127.0.0.1:${address.port}`,
                GITHUB_SHA: revision,
            },
        },
    );
    assert.match(result.stdout, /Verified deployment a{40}.*1 resources/);
});

await test("Pages verifier supports Playwright's CommonJS dependency collection", async (context) => {
    const directory = await temporaryDirectory(context);
    const configuration = join(directory, "playwright.config.cjs");
    await Promise.all([
        writeFile(
            configuration,
            'module.exports = { testDir: __dirname, testMatch: "*.spec.*", reporter: "line" };',
        ),
        writeFile(
            join(directory, "a-pages.spec.mts"),
            `import { test } from ${JSON.stringify(new URL("../node_modules/@playwright/test/index.mjs", import.meta.url).href)};
import { verifyPublished } from ${JSON.stringify(new URL("./pages.mts", import.meta.url).href)};
test("Pages verifier loads", () => {
    if (typeof verifyPublished !== "function") throw new Error("Missing verifier");
});`,
        ),
        writeFile(
            join(directory, "b-json.spec.cjs"),
            `const { test } = require(${JSON.stringify(script("../node_modules/@playwright/test/index.js"))});
const site = require(${JSON.stringify(script("../site.json"))});
test("CommonJS site settings load", () => {
    if (typeof site.url !== "string") throw new Error("Missing site URL");
});`,
        ),
    ]);
    const result = await execute(
        process.execPath,
        [
            script("../node_modules/@playwright/test/cli.js"),
            "test",
            "--list",
            `--config=${configuration}`,
        ],
        { cwd: directory },
    );
    assert.match(result.stdout, /Total: 2 tests in 2 files/);
});

await test("Pages propagation can outlast two minutes but still requires exact canonical resource bytes", async (context) => {
    const started = Date.now();
    let elapsed = 0;
    let staleForever = false;
    const resourceUrls: string[] = [];
    const revision = "a".repeat(40);
    const deployment = {
        revision,
        files: [
            {
                path: "/service-worker.js",
                status: 200,
                sha256: createHash("sha256").update("compiled").digest("hex"),
            },
        ],
    };
    const schedule = globalThis.setTimeout;
    context.mock.method(Date, "now", () => started + elapsed);
    context.mock.method(
        globalThis,
        "setTimeout",
        (callback: () => void, milliseconds?: number) => {
            elapsed += milliseconds ?? 0;
            return schedule(callback, 0);
        },
    );
    const warnings = context.mock.method(console, "warn", () => undefined);
    context.mock.method(globalThis, "fetch", (input: string) => {
        if (input.endsWith("/deployment.json")) {
            return Promise.resolve(Response.json({ revision }));
        }
        resourceUrls.push(input);
        return Promise.resolve(
            new Response(
                staleForever || elapsed < 600_000 ? "stale" : "compiled",
                {
                    headers: {
                        "cache-control": "max-age=600",
                        "cf-cache-status": "HIT",
                    },
                },
            ),
        );
    });
    await verifyPublished("https://example.test", deployment);
    assert.equal(elapsed, 600_000);
    assert.equal(resourceUrls.length, 61);
    assert(
        resourceUrls.every(
            (url) => url === "https://example.test/service-worker.js",
        ),
    );
    assert.equal(warnings.mock.callCount(), 60);
    staleForever = true;
    await assert.rejects(
        verifyPublished("https://example.test", deployment, 2, 10_000),
        /Stale or modified deployed resource: \/service-worker.js.*max-age=600/,
    );
});
