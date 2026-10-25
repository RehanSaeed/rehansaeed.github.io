export interface ImageDimensions {
  width: number;
  height: number;
}

// Conservatively covers the full-bleed images in the capped, fluid content column.
export const contentImageSizes = "sm:100vw lg:1280px";

// Retain the original extension to distinguish foo.png from foo.jpg.
export const getAvifSource = (src: string): string | undefined =>
  /^\/(?!\/).+\.(png|jpg)$/.test(src) ? `${src}.avif` : undefined;
