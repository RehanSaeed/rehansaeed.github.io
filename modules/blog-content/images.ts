import sharp from "sharp";
import type { ImageDimensions } from "../../shared/utils/images";

export async function readImageDimensions(
  file: string,
): Promise<ImageDimensions> {
  const metadata = await sharp(file).metadata();
  const { width, height } = metadata.autoOrient;
  if (!width || !height) {
    throw new Error(`Missing intrinsic image dimensions: ${file}`);
  }
  return { width, height };
}
