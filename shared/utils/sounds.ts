export const socialSounds = {
  youtube: "youtube-play",
  twitch: "twitch-pop",
  gitHub: "github-paw",
  linkedIn: "linkedin-connect",
  stackOverflow: "stack-overflow",
  bluesky: "bluesky-flutter",
  mastodon: "mastodon-puff",
  email: "email-paper",
  rss: "rss-ping",
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

export const soundPath = "/sounds/v3";
