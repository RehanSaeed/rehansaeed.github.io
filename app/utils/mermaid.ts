let renderer: Promise<typeof import("mermaid").default> | undefined;

export function loadMermaid() {
  renderer ??= import("mermaid")
    .then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "strict",
        layout: "dagre",
      });
      return mermaid;
    })
    .catch((error) => {
      renderer = undefined;
      throw error;
    });
  return renderer;
}
