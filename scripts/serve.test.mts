import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

await test("Static preview serves byte ranges and preserves full and HEAD responses", async () => {
    const root = await mkdtemp(join(tmpdir(), "blog-serve-"));
    await writeFile(join(root, "404.html"), "Missing");
    await writeFile(join(root, "video.mp4"), "0123456789");
    const child = spawn(process.execPath, ["scripts/serve.mts", root], {
        env: { ...process.env, PORT: "0" },
        stdio: ["ignore", "pipe", "pipe"],
    });
    try {
        const [output] = (await once(child.stdout, "data")) as [Buffer];
        const port = /localhost:(\d+)/.exec(output.toString())?.[1];
        assert.ok(port, "Preview must report the assigned port.");
        const url = `http://127.0.0.1:${port}/video.mp4`;
        for (const [range, status, contentRange, expected] of [
            ["bytes=2-5", 206, "bytes 2-5/10", "2345"],
            ["bytes=7-", 206, "bytes 7-9/10", "789"],
            ["bytes=-3", 206, "bytes 7-9/10", "789"],
            ["bytes=8-99", 206, "bytes 8-9/10", "89"],
            ["bytes=10-", 416, "bytes */10", ""],
            ["bytes=6-2", 416, "bytes */10", ""],
            ["bytes=-0", 416, "bytes */10", ""],
        ] as const) {
            const response = await fetch(url, { headers: { Range: range } });
            assert.equal(response.status, status);
            assert.equal(response.headers.get("content-range"), contentRange);
            assert.equal(await response.text(), expected);
        }
        const full = await fetch(url);
        assert.equal(full.status, 200);
        assert.equal(await full.text(), "0123456789");
        const head = await fetch(url, {
            method: "HEAD",
            headers: { Range: "bytes=2-5" },
        });
        assert.equal(head.status, 200);
        assert.equal(head.headers.get("content-length"), "10");
        assert.equal(await head.text(), "");
    } finally {
        const exited = once(child, "exit");
        child.kill();
        await exited;
        await rm(root, { recursive: true, force: true });
    }
});
