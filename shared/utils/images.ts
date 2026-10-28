export interface ImageDimensions {
  width: number;
  height: number;
}

// Conservatively covers the full-bleed images in the capped, fluid content column.
export const contentImageSizes =
  "320:100vw 480:100vw sm:100vw md:100vw lg:1280px";

export const getAvifSource = (src: string): string | undefined =>
  /^\/(?!\/).+\.(png|jpg)$/.test(src)
    ? src.replace(/\.(png|jpg)$/, ".avif")
    : undefined;
