export function headingId(value: string): string {
  return value.split(" ").join("-").toLowerCase();
}

export function pageHeadingId(
  title: string,
  content: readonly unknown[] = [],
): string {
  const ids = new Set<string>();
  const collect = (nodes: readonly unknown[]) => {
    for (const node of nodes) {
      if (!Array.isArray(node)) continue;
      const [, properties, ...children] = node;
      if (
        properties !== null &&
        typeof properties === "object" &&
        "id" in properties &&
        typeof properties.id === "string"
      ) {
        ids.add(properties.id);
      }
      collect(children);
    }
  };
  collect(content);

  // Preserve Markdown fragment targets; only rename a colliding page title.
  const base = headingId(title);
  let id = base;
  for (let index = 1; ids.has(id); index++) {
    id = `${base}-title-${index}`;
  }
  return id;
}
