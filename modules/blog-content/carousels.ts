type Node = string | [string, Record<string, unknown>, ...Node[]];
type Element = Exclude<Node, string>;

const elements = (nodes: Node[]) =>
  nodes.filter((node) => typeof node !== "string" || node.trim() !== "");

const isImage = (node: Node): boolean =>
  typeof node !== "string" &&
  (node[0] === "img" ||
    (node[0] === "a" &&
      elements(node.slice(2) as Node[]).length === 1 &&
      isImage(elements(node.slice(2) as Node[])[0]!)));

const imageSlides = (node: Node): Element[] | undefined => {
  if (typeof node === "string") {
    return;
  }
  if (isImage(node)) {
    return [node];
  }
  const children = elements(node.slice(2) as Node[]);
  if (node[0] === "p" && children.length && children.every(isImage)) {
    return children.length === 1
      ? [node]
      : children.map((child) => ["p", { ...node[1] }, child]);
  }
  if (node[0] === "figure") {
    const media = children.filter(
      (child) => typeof child === "string" || child[0] !== "figcaption",
    );
    if (
      children.length - media.length <= 1 &&
      media.length === 1 &&
      imageSlides(media[0]!)?.length === 1
    ) {
      return [node];
    }
  }
};

const frameImage = (node: Element): Element => {
  if (isImage(node)) {
    return ["p", {}, node];
  }
  if (node[0] === "figure") {
    return [
      node[0],
      node[1],
      ...(node.slice(2) as Node[]).map((child): Node =>
        isImage(child) ? ["p", {}, child] : child,
      ),
    ];
  }
  return node;
};

/** Groups adjacent article image blocks without crossing prose or container boundaries. */
export const groupImageCarousels = (nodes: Node[] | undefined): void => {
  if (!nodes) {
    return;
  }
  const output: Node[] = [];
  let run: Element[] = [];
  const flush = () => {
    if (run.length < 2) {
      output.push(...run);
    } else {
      output.push([
        "image-carousel",
        { count: run.length },
        ...run.map((slide): Element => [
          "div",
          { class: "image-carousel__slide" },
          frameImage(slide),
        ]),
      ]);
    }
    run = [];
  };
  for (const node of nodes) {
    const slides = imageSlides(node);
    if (slides) {
      run.push(...slides);
    } else if (typeof node === "string" && !node.trim() && run.length) {
      continue;
    } else {
      flush();
      output.push(node);
    }
  }
  flush();
  nodes.splice(0, nodes.length, ...output);
};
