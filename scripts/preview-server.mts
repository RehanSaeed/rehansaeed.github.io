import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

export const startPreviewServer = async (root: string, port: string) => {
    const server = spawn(
        process.execPath,
        [fileURLToPath(new URL("./serve.mts", import.meta.url)), root],
        {
            env: { ...process.env, PORT: port },
            stdio: ["ignore", "pipe", "inherit"],
        },
    );
    const stop = async () => {
        if (
            server.pid === undefined ||
            server.exitCode !== null ||
            server.signalCode !== null
        ) {
            return;
        }
        const stopped = once(server, "exit");
        server.kill();
        await stopped;
    };
    const controller = new AbortController();
    const signal = AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(15_000),
    ]);
    try {
        await Promise.race([
            once(server.stdout, "data", { signal }),
            once(server, "exit", { signal }).then(([code]) => {
                throw new Error(
                    `Static preview server exited before readiness: ${code}`,
                );
            }),
        ]);
        assert.equal(
            (await fetch(`http://localhost:${port}`, { signal })).status,
            200,
            "Static preview homepage is unavailable.",
        );
        return stop;
    } catch (error) {
        await stop();
        throw error;
    } finally {
        controller.abort();
    }
};
