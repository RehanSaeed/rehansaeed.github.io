export interface ImageDimensions {
  width: number;
  height: number;
}

// Conservatively covers the full-bleed images in the capped, fluid content column.
export const contentImageSizes = "sm:100vw lg:1280px";
