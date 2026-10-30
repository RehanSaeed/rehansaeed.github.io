export const soundNames = [
  "toggle-on",
  "toggle-off",
  "dialog-open",
  "dialog-close",
  "link-hover",
  "link-activate",
  "success",
  "card-hover",
  "card-open",
  "tag-hover",
  "tag-select",
  "page-previous",
  "page-next",
  "social-hover",
  "external-open",
  "anchor-jump",
  "coffee-open",
  "share-open",
  "search-select",
  "form-submit",
  "update-start",
] as const;

export type SoundEffect = (typeof soundNames)[number];

export const soundPath = "/sounds/v2";

type LinkSoundProfile = {
  hover?: SoundEffect;
  activate: SoundEffect;
};

export const linkSoundProfiles = {
  navigation: { hover: "link-hover", activate: "link-activate" },
  card: { hover: "card-hover", activate: "card-open" },
  tag: { hover: "tag-hover", activate: "tag-select" },
  previous: { hover: "card-hover", activate: "page-previous" },
  next: { hover: "card-hover", activate: "page-next" },
  social: { hover: "social-hover", activate: "external-open" },
  search: { hover: "card-hover", activate: "search-select" },
  content: { activate: "link-activate" },
} satisfies Record<string, LinkSoundProfile>;

export type LinkSound = keyof typeof linkSoundProfiles;
export type { LinkSoundProfile };
