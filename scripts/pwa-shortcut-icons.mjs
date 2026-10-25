import { fileURLToPath } from "node:url";
import sharp from "sharp";

const directory = new URL("../public/images/icons/", import.meta.url);
for (const name of ["blog", "portfolio", "about"]) {
  await sharp(fileURLToPath(new URL(`${name}.svg`, directory)))
    .resize(192, 192)
    .png({ palette: false, compressionLevel: 9 })
    .toFile(fileURLToPath(new URL(`${name}.png`, directory)));
}
console.log(
  "Regenerated the three 192x192 PWA shortcut icons from SVG sources.",
);
