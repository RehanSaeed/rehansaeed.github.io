import type { TagButtonVariant } from "~/types/button";

export const supportsTagIcon = (variant: TagButtonVariant) =>
  ["code-token", "keycap"].includes(variant);

export const tagStyleOptions = [
  {
    number: "06",
    id: "code-token",
    name: "Code token",
    description:
      "Monospace, an accent rule and matching rounded right corners.",
  },
  {
    number: "08",
    id: "keycap",
    name: "Keycap",
    description: "Monospace, rounded-square corners and a solid lower edge.",
  },
  {
    number: "10",
    id: "tag-label",
    name: "Tag label",
    description:
      "A decorative tag outline, soft border and medium-weight text.",
  },
] satisfies {
  /** Original comparison number, retained for review continuity. */
  number: string;
  /** Reusable UButton variant and preview URL identifier. */
  id: TagButtonVariant;
  /** Human-readable name shown in the comparison. */
  name: string;
  /** Visual treatment being compared. */
  description: string;
}[];
