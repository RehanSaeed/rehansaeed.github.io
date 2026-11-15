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

const withClass = (node: Element, className: string): Element => {
  const value = node[1].class ?? node[1].className;
  const classes = Array.isArray(value)
    ? value.join(" ")
    : typeof value === "string"
      ? value
      : "";
  return [
    node[0],
    {
      ...node[1],
      class: classes ? `${classes} ${className}` : className,
    },
    ...(node.slice(2) as Node[]),
  ];
};

const frameImage = (node: Element): Element => {
  if (isImage(node)) {
    return ["p", { class: "carousel__media" }, node];
  }
  if (node[0] === "figure") {
    const figure = withClass(node, "carousel__figure");
    return [
      figure[0],
      figure[1],
      ...(figure.slice(2) as Node[]).map((child): Node => {
        if (isImage(child)) {
          return ["p", { class: "carousel__media" }, child];
        }
        if (typeof child !== "string") {
          if (child[0] === "p") {
            return withClass(child, "carousel__media");
          }
          if (child[0] === "figcaption") {
            return withClass(child, "carousel__caption");
          }
        }
        return child;
      }),
    ];
  }
  return withClass(node, "carousel__media");
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
        "carousel",
        {
          count: run.length,
          ...(run.some(
            (slide) => slide[1].dataPaginationComparison !== undefined,
          )
            ? { paginationComparison: true }
            : {}),
        },
        ...run.map((slide): Element => [
          "li",
          { class: "carousel__slide" },
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
