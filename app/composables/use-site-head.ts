/** Head tags shared by the home, about, portfolio, tag and post pages, as in their Gridsome metaInfo. */
export const heroImagePath = "/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg";

export function imageSize(url: string): { width: string; height: string } {
  const match = url.match(/(\d*)x(\d*)/)!;
  return { width: match[1]!, height: match[2]! };
}

export function authorSchema(
  site: ReturnType<typeof useAppConfig>["site"],
  name: string,
) {
  const logo = (size: number) => ({
    "@type": "ImageObject",
    url: `${site.url}/images/author/${name.split(" ").join("-")}/Logo-${size}x${size}.png`,
    width: size,
    height: size,
  });
  return {
    "@type": "Person",
    name,
    logo: [logo(192), logo(512)],
    url: site.url + "/about/",
  };
}

export function publisherSchema(site: ReturnType<typeof useAppConfig>["site"]) {
  return {
    "@type": "Organization",
    name: site.name,
    logo: {
      "@type": "ImageObject",
      url: site.url + "/images/schema/Publisher-600x60.png",
      width: 600,
      height: 60,
    },
    url: site.url,
  };
}
