// unhead deduplicates repeated meta properties unless they are on its allow list. `article:section` isn't, so
// posts pass every heading in one tag separated by new lines and this splits them into one tag per heading.
const separator = "\n";

export default defineNuxtPlugin(() => {
  const head = injectHead();
  head.hooks?.hook("tags:resolve", (ctx) => {
    const noindex = ctx.tags.some(
      (tag) =>
        tag.tag === "meta" &&
        tag.props.name === "robots" &&
        /\bnoindex\b/i.test(String(tag.props.content)),
    );
    if (noindex) {
      ctx.tags = ctx.tags.filter(
        (tag) =>
          tag.tag !== "link" ||
          tag.props.rel !== "alternate" ||
          tag.props.type !== "text/markdown",
      );
    }
    ctx.tags = ctx.tags.flatMap((tag) => {
      const content = tag.props.content;
      if (
        tag.tag !== "meta" ||
        tag.props.property !== "article:section" ||
        typeof content !== "string" ||
        !content.includes(separator)
      ) {
        return [tag];
      }
      return content.split(separator).map((x, i) => ({
        ...tag,
        _d: `${tag._d}:${i}`,
        props: { ...tag.props, content: x },
      }));
    });
  });
});
