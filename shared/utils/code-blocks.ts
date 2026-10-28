export type CodeControlStyle =
  "current" | "plain" | "bordered" | "soft" | "grouped";

export type CodeTabStyle =
  "attached" | "underline" | "segmented" | "pills" | "editor" | "editor-wide";

export interface CodeBlock {
  language?: string;
  filename?: string;
  highlights?: number[];
  meta?: string;
  html?: string;
  class?: string;
}
