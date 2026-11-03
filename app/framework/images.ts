import images from "#blog-image-metadata";

const metadata: Record<string, { width: number; height: number } | undefined> =
  images;

export function getImageMetadata(url: string) {
  const urlMatches = url.match(/(.*)\/(.+)-(\d+)x(\d+)/);
  const dimensions = metadata[new URL(url, "https://image.invalid").pathname];
  if (!urlMatches?.[2] || !dimensions) {
    throw new Error(`Missing build-time image metadata: ${url}`);
  }
  return {
    alt: urlMatches[2].replace("-", " ").replace("_", " "),
    height: String(dimensions.height),
    width: String(dimensions.width),
  };
}

export function getSchemaImageObject(url: string) {
  const imageMeta = getImageMetadata(url);
  return {
    "@type": "ImageObject" as const,
    url: url,
    caption: imageMeta.alt,
    width: imageMeta.width,
    height: imageMeta.height,
  };
}
