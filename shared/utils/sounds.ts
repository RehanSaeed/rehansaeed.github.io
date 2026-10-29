export const soundNames = [
  "toggle-on",
  "toggle-off",
  "dialog-open",
  "dialog-close",
  "link-hover",
  "link-activate",
  "success",
] as const;

export type SoundEffect = (typeof soundNames)[number];
