// A copy of /rss.xml, kept because the Gridsome site also served the RSS feed at this URL.
export default defineEventHandler(async (event) => {
  setResponseHeader(
    event,
    "content-type",
    "application/rss+xml; charset=utf-8",
  );
  return rss2(await createFeed(event));
});
