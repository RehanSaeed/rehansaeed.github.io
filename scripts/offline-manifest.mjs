import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { z } from "zod";
import { getManifest } from "workbox-build";
import { offlineEntrySchema } from "../shared/utils/offline.ts";

const output = resolve("dist");
const worker = join(output, "service-worker.js");
const source = await readFile(worker, "utf8");
const injected = source.match(/\[\{"integrity":"sha256-[\s\S]*?\}\]/)?.[0];
assert.ok(injected, "The generated worker must contain the integrity manifest");
const original = z.array(offlineEntrySchema).parse(JSON.parse(injected));
const { manifestEntries: runtime } = await getManifest({
  globDirectory: output,
  globPatterns: ["**/*.wasm", "__nuxt_content/**/sql_dump.txt"],
  dontCacheBustURLsMatching: /^_nuxt\//,
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
});
assert.ok(
  runtime.some(({ url }) => url.endsWith(".wasm")),
  "The Nuxt Content WebAssembly runtime is required offline",
);
for (const collection of ["posts", "portfolio"]) {
  const url = `__nuxt_content/${collection}/sql_dump.txt`;
  assert.ok(
    runtime.some((entry) => entry.url === url),
    `Required offline database is missing: ${url}`,
  );
}
const entries = [
  ...original,
  ...runtime.filter((entry) => !original.some(({ url }) => url === entry.url)),
];

// Nuxt skew protection updates build metadata after injectManifest has run.
for (const entry of entries) {
  const path =
    entry.url === "/"
      ? "index.html"
      : entry.url.endsWith("/")
        ? `${entry.url}index.html`
        : decodeURIComponent(entry.url);
  const bytes = await readFile(join(output, path));
  entry.integrity = `sha256-${createHash("sha256").update(bytes).digest("base64")}`;
  if (entry.revision !== null) {
    entry.revision = createHash("md5").update(bytes).digest("hex");
  }
}
const manifest = JSON.stringify(
  z
    .array(offlineEntrySchema)
    .parse(entries)
    .map(({ integrity, revision, url }) => ({
      integrity,
      revision,
      url,
    })),
);
await writeFile(worker, source.replace(injected, manifest));
console.log(
  `Finalised ${entries.length} offline assets against deployment bytes.`,
);
