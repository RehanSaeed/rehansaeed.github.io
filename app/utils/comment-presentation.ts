import type { GitHubComment } from "../../shared/utils/comments";

export const commentAssociations = {
  COLLABORATOR: "Collaborator",
  CONTRIBUTOR: "Contributor",
  FIRST_TIMER: "First timer",
  FIRST_TIME_CONTRIBUTOR: "First-time contributor",
  MANNEQUIN: "Mannequin",
  MEMBER: "Member",
  OWNER: "Owner",
};

const reactionTypes = [
  { name: "+1", emoji: "👍", label: "Thumbs up" },
  { name: "-1", emoji: "👎", label: "Thumbs down" },
  { name: "laugh", emoji: "😄", label: "Laugh" },
  { name: "hooray", emoji: "🎉", label: "Hooray" },
  { name: "confused", emoji: "😕", label: "Confused" },
  { name: "heart", emoji: "❤️", label: "Heart" },
  { name: "rocket", emoji: "🚀", label: "Rocket" },
  { name: "eyes", emoji: "👀", label: "Eyes" },
] as const;

export function commentReactions(comment: GitHubComment) {
  return reactionTypes.flatMap((reaction) => {
    const count = comment.reactions?.[reaction.name];
    return typeof count === "number" && Number.isInteger(count) && count > 0
      ? [{ ...reaction, count }]
      : [];
  });
}
