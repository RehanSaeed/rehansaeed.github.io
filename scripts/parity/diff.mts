// Diffs two parity snapshots (see snapshot.mts) and prints every difference.
// Usage: node scripts/parity/diff.mts tests/parity/baseline .parity/local [--ignore meta.gridsome:hash,...]
// Exits with code 1 when differences are found.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isDeepStrictEqual, parseArgs } from "node:util";

const { values: args, positionals } = parseArgs({
    allowPositionals: true,
    options: {
        ignore: { type: "string", default: "" },
        summary: { type: "boolean", default: false },
    },
});

const [expectedDir, actualDir] = positionals;
if (!expectedDir || !actualDir) {
    console.error(
        "Usage: node scripts/parity/diff.mts <expected-dir> <actual-dir>",
    );
    process.exit(2);
}

// Keys that differ by design between frameworks (dotted paths, `*` matches any key).
const defaultIgnores = ["*.meta.gridsome:hash", "*.meta.generator"];
const ignores = [
    ...defaultIgnores,
    ...args.ignore.split(",").filter(Boolean),
].map(
    (pattern) =>
        new RegExp(
            `^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".+")}$`,
        ),
);
const ignored = (path: string) => ignores.some((regex) => regex.test(path));

const load = async (
    dir: string,
    file: string,
): Promise<Record<string, unknown>> =>
    JSON.parse(await readFile(join(dir, file), "utf8"));

const differences: { path: string; expected: unknown; actual: unknown }[] = [];
const compare = (path: string, expected: unknown, actual: unknown) => {
    if (ignored(path) || isDeepStrictEqual(expected, actual)) return;
    const isObject = (value: unknown): value is Record<string, unknown> =>
        value !== null && typeof value === "object" && !Array.isArray(value);
    if (isObject(expected) && isObject(actual)) {
        for (const key of new Set([
            ...Object.keys(expected),
            ...Object.keys(actual),
        ])) {
            compare(`${path}.${key}`, expected[key], actual[key]);
        }
        return;
    }
    differences.push({ path, expected, actual });
};

for (const file of ["pages.json", "artifacts.json"]) {
    const expected = await load(expectedDir, file);
    const actual = await load(actualDir, file);
    const missing = Object.keys(expected).filter((key) => !(key in actual));
    const extra = Object.keys(actual).filter((key) => !(key in expected));
    for (const key of missing)
        differences.push({ path: key, expected: "present", actual: "missing" });
    for (const key of extra)
        differences.push({ path: key, expected: "absent", actual: "extra" });
    for (const key of Object.keys(expected).filter((k) => k in actual)) {
        compare(key, expected[key], actual[key]);
    }
}

const show = (value: unknown) => {
    const json = JSON.stringify(value);
    return json && json.length > 300 ? `${json.slice(0, 300)}…` : json;
};

if (args.summary) {
    const counts: Record<string, number> = {};
    for (const { path } of differences) {
        const field = path.split(".").slice(1).join(".") || "(page)";
        counts[field] = (counts[field] ?? 0) + 1;
    }
    console.table(Object.entries(counts).sort((a, b) => b[1] - a[1]));
} else {
    for (const { path, expected, actual } of differences) {
        console.log(
            `✗ ${path}\n    expected: ${show(expected)}\n    actual:   ${show(actual)}`,
        );
    }
}

console.log(`\n${differences.length} difference(s)`);
process.exit(differences.length ? 1 : 0);
