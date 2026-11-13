import type { TagButtonVariant } from "~/types/button";

export const supportsTagIcon = (variant: TagButtonVariant) =>
  ["code-token", "code-token-rounded", "keycap"].includes(variant);

export const tagStyleOptions = [
  {
    number: "01",
    id: "quiet-pill",
    name: "Quiet pill",
    description: "Black text on a soft lavender wash with fully rounded ends.",
  },
  {
    number: "02",
    id: "hairline-capsule",
    name: "Hairline capsule",
    description: "Black Audiowide lettering within a fine accent outline.",
  },
  {
    number: "04",
    id: "solid-lozenge",
    name: "Muted lozenge",
    description: "A restrained lavender tint instead of a solid accent fill.",
  },
  {
    number: "06",
    id: "code-token",
    name: "Code token",
    description: "Monospace, an accent rule and a rounded bottom-right corner.",
  },
  {
    number: "06b",
    id: "code-token-rounded",
    name: "Rounded code token",
    description:
      "The same monospace accent-rule treatment with all corners rounded.",
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
