const heroImagePath = "/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg";

export function useBlogOgImage(
  title: string,
  heroImage = heroImagePath,
  author = useAppConfig().site.author.name,
) {
  return defineOgImage(
    "BlogTakumi",
    { title, author, heroImage },
    { alt: `${title} - ${author}` },
  );
}
