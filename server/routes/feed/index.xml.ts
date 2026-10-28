// A copy of /rss.xml, kept for existing RSS subscriptions at this URL.
export default defineEventHandler(async (event) => {
  setResponseHeader(
    event,
    "content-type",
    "application/rss+xml; charset=utf-8",
  );
  return rss2(await createFeed(event));
});
