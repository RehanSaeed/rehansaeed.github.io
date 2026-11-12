export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("render:html", (html) => {
    // Color-mode 4 injects its bootstrap after styles; resolve the theme before CSS transitions.
    const index = html.head.findIndex(
      (tag) =>
        tag.startsWith("<script>") && tag.includes("__NUXT_COLOR_MODE__"),
    );
    const script = html.head[index];
    if (!script) {
      throw new Error("The color-mode pre-paint script is missing.");
    }
    const head = html.head.filter((_, position) => position !== index).join("");
    const charset = /<meta charset="[^"]+">/i;
    if (!charset.test(head)) {
      throw new Error("The page charset declaration is missing.");
    }
    html.head = [head.replace(charset, (tag) => tag + script)];
  });
});
