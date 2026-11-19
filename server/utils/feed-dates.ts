type FeedPostDates = {
  date: string;
  dateModified?: string | null;
};

/** The effective update date and original publication date for a feed item. */
export const getItemDates = (post: FeedPostDates) => ({
  date: new Date(post.dateModified ?? post.date),
  published: new Date(post.date),
});

/** Uses the newest effective item date, leaving empty-feed defaults to the feed library. */
export const getFeedFreshness = (posts: FeedPostDates[]) => {
  let updated: Date | undefined;
  for (const post of posts) {
    const date = getItemDates(post).date;
    if (!updated || date > updated) {
      updated = date;
    }
  }
  return updated ? { updated } : {};
};
