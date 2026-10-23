// The RSS 2.0 feed.
export default defineEventHandler(async (event) => {
  setResponseHeader(
    event,
    "content-type",
    "application/rss+xml; charset=utf-8",
  );
  return rss2(await createFeed(event));
});
