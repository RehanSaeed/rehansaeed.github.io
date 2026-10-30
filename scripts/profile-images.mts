import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const [source, topArgument] = process.argv.slice(2);
const top = Number(topArgument);
if (!source || topArgument === undefined || !Number.isInteger(top) || top < 0) {
    throw new Error(
        'Usage: node scripts/profile-images.mts "<portrait.jpg>" <square-crop-top>',
    );
}

const { data, info } = await sharp(source)
    .autoOrient()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
const portrait = sharp(data, { raw: info });
const { width, height } = info;
if (!width || !height || top + width > height) {
    throw new Error("The full-width square crop must fit inside the portrait.");
}
const square = portrait.clone().extract({
    left: 0,
    top,
    width,
    height: width,
});
const publicFile = (path: string) =>
    fileURLToPath(new URL(`../public/${path}`, import.meta.url));
const authorDirectory = "images/author/Muhammad-Rehan-Saeed";

await portrait
    .clone()
    .resize(320, 480)
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(publicFile(`${authorDirectory}/Profile-320x480.jpg`));

const iconSizes = [16, 48, 72, 96, 120, 128, 144, 152, 180, 192, 384, 512];
for (const size of new Set([...iconSizes, 64])) {
    const png = await square
        .clone()
        .resize(size, size)
        // Photo gradients need truecolour; palette quantization causes posterization.
        .png({ palette: false, compressionLevel: 9 })
        .toBuffer();
    if (iconSizes.includes(size)) {
        await writeFile(
            publicFile(`images/icons/favicon-${size}x${size}.png`),
            png,
        );
    }
    if ([64, 192, 512].includes(size)) {
        await writeFile(
            publicFile(`${authorDirectory}/Logo-${size}x${size}.png`),
            png,
        );
    }
    if (size === 512) {
        await writeFile(publicFile("favicon.png"), png);
    }
}

const icoSizes = [48, 32, 16];
const directory = Buffer.alloc(6 + icoSizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(icoSizes.length, 4);
const images = [];
let offset = directory.length;
for (const [index, size] of icoSizes.entries()) {
    const png = await square
        .clone()
        .resize(size, size)
        .png({ palette: false, compressionLevel: 9 })
        .toBuffer();
    const entry = 6 + index * 16;
    directory[entry] = size;
    directory[entry + 1] = size;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(24, entry + 6);
    directory.writeUInt32LE(png.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    images.push(png);
    offset += png.length;
}
await writeFile(
    publicFile("favicon.ico"),
    Buffer.concat([directory, ...images]),
);
console.log(
    "Regenerated profile photos and raster icons without palette reduction.",
);
