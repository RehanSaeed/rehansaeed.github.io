import type { Node, Renderer } from "@takumi-rs/core";

export async function fitOgTitleLines(
  root: Node,
  renderer: Pick<Renderer, "measure">,
) {
  while (root.type === "container" && root.children?.length === 1) {
    root = root.children[0]!;
  }
  const foreground = root.type === "container" ? root.children?.[1] : undefined;
  const title =
    foreground?.type === "container" ? foreground.children?.[0] : undefined;
  if (
    title?.type !== "text" ||
    foreground?.type !== "container" ||
    !foreground.children
  ) {
    throw new Error("Unexpected BlogTakumi title structure");
  }

  // Native line measurements keep the backgrounds aligned with the rendered font.
  const measured = await renderer.measure(
    {
      ...title,
      style: {
        ...title.style,
        fontFamily: "Audiowide",
        width: 1088,
      },
    },
    { width: 1088, height: 630 },
  );
  if (!measured.runs.length) {
    throw new Error("BlogTakumi title has no measured text");
  }
  const lines = new Map<number, { text: string; width: number }>();
  const titleStyle: unknown = title.style;
  if (titleStyle != null && typeof titleStyle !== "object") {
    throw new Error("Unexpected BlogTakumi title style");
  }
  for (const run of measured.runs) {
    const line = lines.get(run.y) ?? { text: "", width: 0 };
    line.text += run.text;
    line.width = Math.max(line.width, run.x + run.width);
    lines.set(run.y, line);
  }
  foreground.children[0] = {
    type: "container",
    style: {
      display: "flex",
      flexDirection: "column",
      alignSelf: "flex-start",
      gap: 8,
      maxWidth: "100%",
    },
    children: [...lines.values()].map((line) => ({
      type: "text",
      text: line.text,
      style: {
        ...(titleStyle ?? {}),
        alignSelf: "flex-start",
        width: Math.min(1088, Math.ceil(line.width) + 48),
        padding: "12px 24px",
      },
    })),
  };
}
