// The Atom 1.0 feed.
export default defineEventHandler(async (event) => {
  setResponseHeader(
    event,
    "content-type",
    "application/atom+xml; charset=utf-8",
  );
  return (await createFeed(event)).atom1();
});
