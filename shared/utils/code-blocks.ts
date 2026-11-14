export type CodeTabStyle =
  "attached" | "underline" | "segmented" | "pills" | "editor" | "editor-wide";

export interface CodeBlock {
  /** Language used for syntax highlighting. */
  language?: string;
  /** Optional filename displayed with the code block. */
  filename?: string;
  /** Line numbers to highlight in the code block. */
  highlights?: number[];
  /** Code-fence metadata controlling features such as line numbers. */
  meta?: string;
  /** Prerendered, syntax-highlighted code markup. */
  html?: string;
  /** Additional CSS classes supplied by the Markdown renderer. */
  class?: string;
}
