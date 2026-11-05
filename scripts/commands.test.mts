import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import packageConfiguration from "../package.json" with { type: "json" };

const { scripts, scriptDescriptions } = packageConfiguration;

await test("every npm script has exactly one nonempty description", () => {
    assert.deepEqual(
        Object.keys(scriptDescriptions).sort(),
        Object.keys(scripts).sort(),
    );
    for (const [name, description] of Object.entries(scriptDescriptions)) {
        assert(description.trim(), `${name} needs a description`);
    }
});

await test("command help prints every script and its description", async () => {
    const { stdout } = await promisify(execFile)(process.execPath, [
        fileURLToPath(new URL("./commands.mts", import.meta.url)),
    ]);
    for (const [name, description] of Object.entries(scriptDescriptions)) {
        assert(
            stdout.includes(
                `${name.padEnd(Math.max(...Object.keys(scripts).map((key) => key.length)))}  ${description}`,
            ),
        );
    }
});
