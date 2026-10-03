// A copy of /atom.xml at the URL Gridsome mistakenly linked as the Atom feed's self link.
export default defineEventHandler(async (event) => {
  setResponseHeader(
    event,
    "content-type",
    "application/atom+xml; charset=utf-8",
  );
  return (await createFeed(event)).atom1();
});
