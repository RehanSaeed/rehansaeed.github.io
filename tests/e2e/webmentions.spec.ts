import sharp from "sharp";
import { expect, test } from "./fixtures";

const postPath =
  "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/";
const api = /^https:\/\/webmention\.io\/api\/mentions\?/;
const published = "2026-01-02T00:00:00Z";

test("Likes and reposts tolerate anonymous authors and missing or broken photos", async ({
  page,
}) => {
  const photo = "https://avatars.githubusercontent.com/webmention-valid.png";
  const broken = "https://avatars.githubusercontent.com/webmention-broken.png";
  const corrupt =
    "https://avatars.githubusercontent.com/webmention-corrupt.png";
  const authors = [
    undefined,
    null,
    {},
    { name: " ", photo: " " },
    { name: null, photo },
    { name: "Reader", photo: "" },
    { name: "Reader", photo: broken },
    { name: "Reader", photo: corrupt },
    { name: "Reader", photo },
  ];
  const image = await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 3,
      background: { r: 240, g: 32, b: 64 },
    },
  })
    .png()
    .toBuffer();
  await page.route(photo, (route) =>
    route.fulfill({ contentType: "image/png", body: image }),
  );
  await page.route(broken, (route) => route.abort());
  await page.route(corrupt, (route) =>
    route.fulfill({ contentType: "image/png", body: "not an image" }),
  );
  await page.route(api, (route) =>
    route.fulfill({
      json: {
        links: ["like", "repost"].flatMap((type) =>
          authors.map((author, index) => ({
            id: `${type}-${index}`,
            activity: { type },
            data: {
              url: `https://example.com/${type}/${index}`,
              author,
              published: index === 0 ? null : published,
            },
          })),
        ),
      },
    }),
  );
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(postPath);
  await expect(
    page.getByRole("button", { name: "Open search", exact: true }),
  ).toBeEnabled({ timeout: 60_000 });
  const mentions = page.locator(".webmentions");
  await mentions.scrollIntoViewIfNeeded();
  await expect(mentions).toHaveAttribute("aria-busy", "false");

  for (const type of ["like", "repost"]) {
    const faces = mentions.locator(
      `.webmentions__${type}-faces .webmention-faces__face`,
    );
    await expect(faces).toHaveCount(authors.length);
    for (const [index, author] of authors.entries()) {
      const face = faces.nth(index);
      const name = author?.name?.trim() || "Anonymous";
      const label = index === 0 ? name : `${name} - 2 January 2026`;
      await expect(face).toHaveAccessibleName(label);
      await expect(face).not.toHaveAttribute("title");
      await expect(face).toHaveAttribute(
        "href",
        `https://example.com/${type}/${index}`,
      );
      await expect(face).toHaveAttribute("rel", "ugc nofollow");
      await face.focus();
      await expect(face).toBeFocused();
      await expect(face).toHaveAccessibleDescription(label);
      if (author?.photo === photo) {
        await expect(face.locator("img")).toHaveAttribute("alt", name);
        await expect
          .poll(() =>
            face
              .locator("img")
              .evaluate((image: HTMLImageElement) => image.naturalWidth),
          )
          .toBeGreaterThan(0);
        await expect(face.locator(".avatar__fallback")).toHaveCount(0);
      } else {
        const fallback = face.locator("svg.avatar__fallback");
        await expect(fallback).toBeVisible();
        await expect(fallback).toHaveAttribute("aria-hidden", "true");
        await expect(fallback.locator("path")).not.toHaveCount(0);
        const geometry = await face.evaluate((element) => {
          const frame = element.getBoundingClientRect();
          const icon = element
            .querySelector(".avatar__fallback")!
            .getBoundingClientRect();
          return {
            frame: [frame.width, frame.height],
            icon: [icon.width, icon.height],
          };
        });
        expect(geometry.icon[0]).toBeCloseTo(geometry.frame[0], 1);
        expect(geometry.icon[1]).toBeCloseTo(geometry.frame[1], 1);
        await expect(face.locator("img")).toHaveCount(0);
      }
    }
  }
  await expect(mentions.locator(".webmentions__like-count")).toHaveText(
    "9 Likes",
  );
  await expect(mentions.locator(".webmentions__repost-count")).toHaveText(
    "9 Reposts",
  );
  expect(pageErrors).toEqual([]);
});

test("Webmention links are user-generated without changing editorial links", async ({
  page,
}) => {
  const author = {
    name: "Reader",
    photo: "https://example.com/avatar.png",
  };
  await page.route(api, (route) =>
    route.fulfill({
      json: {
        links: [
          {
            id: "plain-link",
            source: "https://example.com/plain-link",
            verified_date: published,
            activity: { type: "link" },
            data: { published },
          },
          {
            id: "reply",
            activity: { type: "reply" },
            data: {
              url: "https://example.com/reply",
              author,
              published,
              content:
                '<p>A <strong>formatted reply</strong> with <a href="https://example.com/first">a link</a> and <a href="https://example.com/second" rel="noopener noreferrer sponsored nofollow" target="_blank">another link</a>.</p>',
            },
          },
          {
            id: "photo-link",
            activity: {
              type: "link",
              sentence_html:
                '<p>A mention with <a href="https://example.com/sentence" rel="me">a sentence link</a>.</p>',
            },
            data: {
              url: "https://example.com/photo-link",
              author,
              published,
              content: "<p>Not the sentence.</p>",
            },
          },
          {
            id: "twitter-link",
            activity: {
              type: "link",
              sentence_html: "<p>Not the tweet.</p>",
            },
            data: {
              url: "https://twitter.com/reader/status/123",
              author,
              published,
              content:
                '<p>A tweet with <a href="https://example.com/tweet">a tweet link</a>.</p>',
            },
          },
        ],
      },
    }),
  );
  await page.goto(postPath);
  await expect(
    page.getByRole("button", { name: "Open search", exact: true }),
  ).toBeEnabled({ timeout: 60_000 });
  const mentions = page.locator(".webmentions");
  await mentions.scrollIntoViewIfNeeded();
  await expect(mentions).toHaveAttribute("aria-busy", "false");
  await expect(mentions.locator(".webmentions__link-count")).toHaveText(
    "1 Linked",
  );
  await expect(mentions.locator(".webmentions__reply-count")).toHaveText(
    "3 Replies",
  );
  const source = mentions.locator(".webmention-link__author a");
  await expect(source).toHaveAttribute(
    "href",
    "https://example.com/plain-link",
  );
  await expect(source).toHaveAttribute("rel", "ugc nofollow");
  await expect(
    mentions.locator(".webmention-link__author"),
  ).not.toHaveAttribute("rel");
  const replyLinks = mentions.locator(".webmention-reply a[href]");
  await expect(replyLinks).toHaveCount(10);
  for (const link of await replyLinks.all()) {
    const tokens = (await link.getAttribute("rel"))!.split(/\s+/);
    expect(tokens).toEqual(expect.arrayContaining(["ugc", "nofollow"]));
    expect(tokens.filter((token) => token === "nofollow")).toHaveLength(1);
  }
  await expect(
    mentions.locator(".webmention-reply__content strong"),
  ).toHaveText("formatted reply");
  const existing = mentions.locator('a[href="https://example.com/second"]');
  await expect(existing).toHaveAttribute("target", "_blank");
  await expect(existing).toHaveAttribute(
    "rel",
    "noopener noreferrer sponsored nofollow ugc",
  );
  await expect(
    mentions.locator('a[href="https://example.com/sentence"]'),
  ).toHaveAttribute("rel", "me ugc nofollow");
  await expect(
    mentions.locator('a[href="https://example.com/tweet"]'),
  ).toHaveText("a tweet link");
  await expect(
    mentions.getByRole("link", { name: "What's this?" }),
  ).not.toHaveAttribute("rel", /ugc|nofollow/);
  await expect(
    page.locator(".post-page__content a[href]").first(),
  ).not.toHaveAttribute("rel", /ugc/);
});

for (const failure of ["network", "http", "json", "shape"]) {
  test(`A ${failure} failure is visible and retry loads the mentions`, async ({
    page,
  }) => {
    let requests = 0;
    let resume!: () => void;
    const retry = new Promise<void>((resolve) => {
      resume = resolve;
    });
    await page.route(api, async (route) => {
      requests++;
      if (requests === 1) {
        if (failure === "network") {
          return route.abort();
        }
        if (failure === "http") {
          return route.fulfill({ status: 503, json: { links: [] } });
        }
        if (failure === "json") {
          return route.fulfill({
            contentType: "application/json",
            body: "invalid json",
          });
        }
        return route.fulfill({ json: { links: null } });
      }
      await retry;
      return route.fulfill({
        json: {
          links: [
            {
              id: 1,
              activity: { type: "like" },
              data: { url: "https://example.com/like", published },
            },
          ],
        },
      });
    });
    await page.goto(postPath);
    await expect(
      page.getByRole("button", { name: "Open search", exact: true }),
    ).toBeEnabled({ timeout: 60_000 });
    const mentions = page.locator(".webmentions");
    await mentions.scrollIntoViewIfNeeded();
    await expect(mentions.getByRole("alert")).toHaveText(
      "Unable to load Web Mentions. Please try again.",
    );
    await expect(mentions).toHaveAttribute("aria-busy", "false");
    await expect(mentions.locator(".webmentions__count")).toHaveCount(0);
    const retryButton = mentions.getByRole("button", {
      name: "Retry",
      exact: true,
    });
    const icon = retryButton.locator("svg.icon");
    await expect(icon).toBeVisible();
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon.locator("path, polyline")).not.toHaveCount(0);
    const alignment = await retryButton.evaluate((button) => {
      const bounds = button.getBoundingClientRect();
      const parent = button.parentElement!.getBoundingClientRect();
      return {
        buttonCenter: bounds.left + bounds.width / 2,
        parentCenter: parent.left + parent.width / 2,
      };
    });
    expect(alignment.buttonCenter).toBeCloseTo(alignment.parentCenter, 1);
    try {
      await mentions
        .getByRole("button", { name: "Retry", exact: true })
        .click();
      await expect(mentions).toHaveAttribute("aria-busy", "true");
      await expect(mentions.getByRole("alert")).toHaveCount(0);
      await expect(mentions.getByRole("button", { name: "Retry" })).toHaveCount(
        0,
      );
      await expect(
        mentions.locator(".webmention-faces-skeleton").first(),
      ).toBeVisible();
    } finally {
      resume();
    }
    await expect(mentions).toHaveAttribute("aria-busy", "false");
    await expect(mentions.locator(".webmentions__like-count")).toHaveText(
      "1 Like",
    );
    await expect(
      mentions.getByRole("link", { name: "Anonymous - 2 January 2026" }),
    ).toBeVisible();
    expect(requests).toBe(2);
  });
}

test("A failed retry remains retryable and an empty success shows zero counts", async ({
  page,
}) => {
  let requests = 0;
  await page.route(api, (route) => {
    requests++;
    return route.fulfill({
      status: requests < 3 ? 503 : 200,
      json: { links: [] },
    });
  });
  await page.goto(postPath);
  await expect(
    page.getByRole("button", { name: "Open search", exact: true }),
  ).toBeEnabled({ timeout: 60_000 });
  const mentions = page.locator(".webmentions");
  await mentions.scrollIntoViewIfNeeded();
  await expect(mentions.getByRole("alert")).toBeVisible();
  await mentions.getByRole("button", { name: "Retry", exact: true }).click();
  await expect.poll(() => requests).toBe(2);
  await expect(mentions.getByRole("alert")).toBeVisible();
  await mentions.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(mentions.getByRole("alert")).toHaveCount(0);
  await expect(mentions.locator(".webmentions__like-count")).toHaveText(
    "0 Likes",
  );
  await expect(mentions.locator(".webmentions__repost-count")).toHaveText(
    "0 Reposts",
  );
  await expect(mentions.locator(".webmentions__link-count")).toHaveText(
    "0 Linked",
  );
  await expect(mentions.locator(".webmentions__reply-count")).toHaveText(
    "0 Replies",
  );
  expect(requests).toBe(3);
});
