export const socialSounds = {
  gitHub: "github-meow",
  bluesky: "bluesky-wings",
  email: "email-paper",
} as const;

export const hoverSoundNames = [
  "tag-hover",
  ...Object.values(socialSounds),
] as const;

export const soundNames = [
  "toggle-on",
  "toggle-off",
  "enable-sound",
  ...hoverSoundNames,
] as const;

export type SoundEffect = (typeof soundNames)[number];
export type HoverSoundEffect = (typeof hoverSoundNames)[number];

export const soundPath = "/sounds/v4";
