import images from "#blog-image-metadata";

export function getImageMetadata(url) {
  const urlMatches = url.match(/(.*)\/(.+)-(\d+)x(\d+)/);
  const dimensions = images[new URL(url, "https://image.invalid").pathname];
  if (!urlMatches || !dimensions) {
    throw new Error(`Missing build-time image metadata: ${url}`);
  }
  return {
    alt: urlMatches[2].replace("-", " ").replace("_", " "),
    height: String(dimensions.height),
    width: String(dimensions.width),
  };
}

export function getSchemaImageObject(url) {
  const imageMeta = getImageMetadata(url);
  return {
    "@type": "ImageObject",
    url: url,
    caption: imageMeta.alt,
    width: imageMeta.width,
    height: imageMeta.height,
  };
}
