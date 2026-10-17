export function filterMarkdownSitemap(
  markdown: string,
  excluded: ReadonlySet<string>,
): string {
  const sections = markdown.split(/\n(?=## )/).map((section) => {
    const lines = section.split("\n").filter((line) => {
      const link = line.match(/^- \[.*\]\((https?:\/\/[^\s)]+)/);
      if (!link) return true;
      const path = new URL(link[1]!).pathname
        .replace(/\.md$/, "")
        .replace(/\/$/, "");
      return !excluded.has(path);
    });
    return lines[0]?.startsWith("## ") &&
      !lines.some((line) => line.startsWith("- ["))
      ? ""
      : lines.join("\n");
  });
  return `${sections.filter(Boolean).join("\n").trimEnd()}\n`;
}
