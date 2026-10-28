// A copy of /atom.xml at the legacy Atom feed's self-link URL.
export default defineEventHandler(async (event) => {
  setResponseHeader(
    event,
    "content-type",
    "application/atom+xml; charset=utf-8",
  );
  return (await createFeed(event)).atom1();
});
