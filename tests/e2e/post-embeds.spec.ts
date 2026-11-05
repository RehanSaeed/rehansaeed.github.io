import { expect, test } from "@playwright/test";

const postURL = "/ai-learnings-from-upgrading-my-blog/";
const videoURL = "https://x.com/MengTo/status/2090817187900780961/video/1";

test("The article embeds the requested X post with tracking personalisation disabled", async ({
  page,
}) => {
  await page.route("https://platform.twitter.com/widgets.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: `window.twttr = { widgets: { createTweet(id, container, options) {
        const frame = document.createElement("iframe");
        frame.title = "Embedded X post";
        frame.dataset.postId = id;
        frame.dataset.dnt = String(options.dnt);
        container.append(frame);
        return Promise.resolve(frame);
      } } };`,
    }),
  );
  await page.goto(postURL, { waitUntil: "domcontentloaded" });
  const frame = page.locator(".x-post iframe");
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute("data-post-id", "2090817187900780961");
  await expect(frame).toHaveAttribute("data-dnt", "true");
  await expect(
    page.getByRole("link", { name: "Watch the ThreeUI demonstration on X." }),
  ).toHaveAttribute("href", videoURL);
});

test("An unavailable X embed reports the error and keeps the original video link", async ({
  page,
}) => {
  await page.route("https://platform.twitter.com/widgets.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: `window.twttr = { widgets: {
        createTweet() { return Promise.resolve(undefined); }
      } };`,
    }),
  );
  await page.goto(postURL, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".x-post").getByRole("alert")).toHaveText(
    "Unable to load the embedded X post. You can still watch it using the link below.",
  );
  await expect(
    page.getByRole("link", { name: "Watch the ThreeUI demonstration on X." }),
  ).toHaveAttribute("href", videoURL);
});
