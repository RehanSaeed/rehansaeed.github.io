import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

async function images(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await images(path)));
    } else if (/\.jpeg$/i.test(entry.name)) {
      throw new Error(`Use .jpg rather than .jpeg: ${path}`);
    } else if (/\.(png|jpg)$/i.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

const sources = [...(await images("public")), ...(await images("content"))];
const outputPath = (file) => file.replace(/\.(png|jpg)$/i, ".avif");
const preferredSources = new Map();
for (const file of sources.sort()) {
  const output = outputPath(file);
  if (!preferredSources.has(output) || /\.png$/i.test(file)) {
    preferredSources.set(output, file);
  }
}
const files = [...preferredSources.values()];
let sourceBytes = 0;
let avifBytes = 0;
// Bound simultaneous encodes: AVIF encoders use several threads per image.
await Promise.all(
  Array.from({ length: 2 }, async () => {
    while (files.length) {
      const file = files.shift();
      const image = sharp(file).autoOrient();
      const output = await image
        .avif({ quality: 60, effort: 4, chromaSubsampling: "4:4:4" })
        .toFile(outputPath(file));
      sourceBytes += (await stat(file)).size;
      avifBytes += output.size;
      console.log(`${file}: ${output.size} AVIF bytes`);
    }
  }),
);
console.log(`AVIF: ${avifBytes} bytes; originals: ${sourceBytes} bytes.`);
