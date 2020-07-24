export function getImageMetadata(url) {
  const urlMatches = url.match(/(.*)\/(.+)-(\d+)x(\d+)/);
  return {
    alt: urlMatches[2].replace("-", " ").replace("_", " "),
    height: urlMatches[4],
    width: urlMatches[3]
  };
}

export function getOpenGraphImage(url) {
  const imageMeta = getImageMetadata(url);
  return [
    { property: "og:image", content: url },
    { property: "og:image:alt", content: imageMeta.alt },
    { property: "og:image:height", content: imageMeta.height },
    { property: "og:image:width", content: imageMeta.width }
  ];
}

export function getSchemaImageObject(url) {
  const imageMeta = getImageMetadata(url);
  return {
    "@type": "ImageObject",
    url: url,
    alternativeHeadline: imageMeta.alt,
    width: imageMeta.width,
    height: imageMeta.height
  };
}
