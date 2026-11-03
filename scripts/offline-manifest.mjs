import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { z } from "zod";
import { offlineEntrySchema } from "../shared/utils/offline.ts";

const output = resolve("dist");
const worker = join(output, "service-worker.js");
const source = await readFile(worker, "utf8");
const injected = source.match(/\[\{"integrity":"sha256-[\s\S]*?\}\]/)?.[0];
assert.ok(injected, "The generated worker must contain the integrity manifest");
const entries = z.array(offlineEntrySchema).parse(JSON.parse(injected));

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
  entries.map(({ integrity, revision, url }) => ({ integrity, revision, url })),
);
await writeFile(worker, source.replace(injected, manifest));
console.log(
  `Finalised ${entries.length} offline assets against deployment bytes.`,
);
