import type { GitHubComment } from "../../shared/utils/comments";

export function commentAssociation(
  association: GitHubComment["author_association"],
) {
  if (!association || association === "NONE") {
    return undefined;
  }
  const label = association.toLowerCase().replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

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
