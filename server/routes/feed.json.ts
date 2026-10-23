// The JSON Feed.
export default defineEventHandler(async (event) => {
  setResponseHeader(
    event,
    "content-type",
    "application/feed+json; charset=utf-8",
  );
  return (await createFeed(event)).json1();
});
