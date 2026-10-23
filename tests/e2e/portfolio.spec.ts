import { load } from "cheerio";
import sharp from "sharp";
import { expect, test } from "./fixtures";

async function expectFilledCompanionCorners(image: Buffer) {
  const { data, info } = await sharp(image)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const corners = [
    [0, 0],
    [info.width - 1, 0],
    [0, info.height - 1],
    [info.width - 1, info.height - 1],
  ] as const;
  for (const [x, y] of corners) {
    const offset = (y * info.width + x) * 4;
    expect(data[offset + 3]).toBe(255);
    expect(Math.min(...data.subarray(offset, offset + 3))).toBeLessThan(240);
  }
}

const repositories = [
  "Dotnet-Boxed/Templates",
  "RehanSaeed/Bash-Cheat-Sheet",
  "Dotnet-Boxed/Framework",
  "RehanSaeed/Schema.NET",
  "RehanSaeed/EditorConfig",
  "RehanSaeed/Serilog.Exceptions",
  "RehanSaeed/.NET-Big-O-Algorithm-Complexity-Cheat-Sheet",
  "RehanSaeed/Kubernetes-Cheat-Sheet",
  "RehanSaeed/Serilog.Enrichers.Span",
  "RehanSaeed/Helm-Cheat-Sheet",
  "RehanSaeed/Elysium-Extra",
  "RehanSaeed/Git-Cheat-Sheet",
];
const nugetPackages: Record<string, string[]> = {
  "Dotnet-Boxed/Templates": ["Boxed.Templates", "Boilerplate.Templates"],
  "Dotnet-Boxed/Framework": [
    "Boxed.Mapping",
    "Boxed.AspNetCore",
    "Boxed.AspNetCore.Swagger",
    "Boxed.AspNetCore.TagHelpers",
    "Boxed.DotnetNewTest",
  ],
  "RehanSaeed/Schema.NET": ["Schema.NET", "Schema.NET.Pending"],
  "RehanSaeed/Serilog.Exceptions": [
    "Serilog.Exceptions",
    "Serilog.Exceptions.SqlServer",
    "Serilog.Exceptions.MsSqlServer",
    "Serilog.Exceptions.EntityFrameworkCore",
    "Serilog.Exceptions.Refit",
    "Serilog.Exceptions.Grpc",
  ],
  "RehanSaeed/Serilog.Enrichers.Span": ["Serilog.Enrichers.Span"],
  "RehanSaeed/Elysium-Extra": ["Elysium.Extra"],
};
test("All portfolio cards and popularity ordering are present in static HTML", async ({
  request,
}) => {
  const response = await request.get("/portfolio/");
  expect(response.ok()).toBe(true);
  const $ = load(await response.text());
  const cards = $(".portfolio__open-source .portfolio-card");
  expect(cards).toHaveLength(repositories.length);
  expect(cards.text()).not.toContain("HttpClientSample");
  expect($(".portfolio__open-source").text()).not.toContain(
    "Ordered by total NuGet package downloads",
  );
  const popularity = cards
    .map((_, card) => ({
      downloads: Number($(card).attr("data-nuget-downloads")),
      stars: Number(
        $(card)
          .find(".portfolio-card__stars")
          .attr("alt")
          ?.match(/: (\d+) GitHub stars at last build$/)?.[1],
      ),
      title: $(card).find(".portfolio-card__title").text(),
    }))
    .get();
  expect(
    popularity.every(
      ({ downloads, stars }) =>
        Number.isSafeInteger(downloads) &&
        downloads >= 0 &&
        Number.isSafeInteger(stars) &&
        stars >= 0,
    ),
  ).toBe(true);
  expect(popularity).toEqual(
    [...popularity].sort(
      (a, b) =>
        b.downloads - a.downloads ||
        b.stars - a.stars ||
        a.title.localeCompare(b.title),
    ),
  );
  const links = cards
    .find(".portfolio-card__title a")
    .map((_, link) => $(link).attr("href"))
    .get();
  expect(links.toSorted()).toEqual(
    repositories
      .map((repository) => `https://github.com/${repository}`)
      .toSorted(),
  );
  expect($(".portfolio-card__stars")).toHaveLength(repositories.length);
  expect($(".portfolio-card__forks")).toHaveLength(repositories.length);
  expect($(".portfolio-card__downloads")).toHaveLength(17);
  const bashHero = cards
    .filter(
      (_, card) =>
        $(card).find(".portfolio-card__title a").attr("href") ===
        "https://github.com/RehanSaeed/Bash-Cheat-Sheet",
    )
    .find(".portfolio-card__image");
  expect(bashHero.attr("src")).toContain("Bash-Cheat-Sheet-1600x900.png");
  expect(bashHero.attr("width")).toBe("1600");
  expect(bashHero.attr("height")).toBe("900");
  cards.each((_, card) => {
    const repository = new URL(
      $(card).find(".portfolio-card__title a").attr("href")!,
    ).pathname.slice(1);
    expect(
      $(card)
        .find(".portfolio-card__nuget")
        .map((_, link) => $(link).attr("href"))
        .get(),
    ).toEqual(
      (nugetPackages[repository] ?? []).map(
        (id) => `https://www.nuget.org/packages/${id}`,
      ),
    );
    const packages = $(card).find(".portfolio-card__nuget");
    const counts = packages
      .map((_, link) => Number($(link).attr("data-downloads")))
      .get();
    expect(
      counts.every((count) => Number.isSafeInteger(count) && count >= 0),
    ).toBe(true);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(
      Number($(card).attr("data-nuget-downloads")),
    );
    expect(
      packages
        .find(".portfolio-card__downloads")
        .map((_, image) =>
          new URL($(image).attr("src")!).searchParams.get("label"),
        )
        .get(),
    ).toEqual(nugetPackages[repository] ?? []);
  });
});

test("Microsoft work precedes open source and links to public product articles without repository badges", async ({
  request,
}) => {
  const response = await request.get("/portfolio/");
  const $ = load(await response.text());
  expect($(".portfolio-card")).toHaveLength(repositories.length + 4);
  const sections = $(".portfolio__section")
    .map((_, section) => $(section).attr("aria-labelledby"))
    .get();
  expect(sections).toEqual(["portfolio-microsoft", "portfolio-open-source"]);
  expect(
    $(".portfolio__section h2")
      .map((_, heading) => $(heading).text())
      .get(),
  ).toEqual(["Contributions at Microsoft", "Open Source"]);
  const cards = $(".portfolio__microsoft .portfolio-card");
  expect(cards).toHaveLength(4);
  expect(
    cards
      .find(".portfolio-card__title")
      .map((_, title) => $(title).text())
      .get(),
  ).toEqual([
    "Microsoft Copilot for Windows",
    "Microsoft 365 Companion Apps",
    "Microsoft Edge Enterprise New Tab",
    "Cortana for Windows",
  ]);
  expect(cards.find(".portfolio-card__badges")).toHaveLength(0);
  expect(
    cards
      .find(".portfolio-card__title a")
      .map((_, link) => $(link).attr("href"))
      .get(),
  ).toEqual([
    "https://blogs.windows.com/windows-insider/2026/03/04/copilot-app-on-windows-opening-web-links-alongside-your-conversations-begins-rolling-out-to-windows-insiders/",
    "https://microsoft.design/articles/from-incubation-to-impact-microsoft-365-companion-apps/",
    "https://blogs.windows.com/msedgedev/2021/10/28/microsoft-edge-features-microsoft-365-reduce-pain-context-switching/",
    "https://blogs.windows.com/windowsexperience/2020/02/28/cortana-in-the-upcoming-windows-10-release-focused-on-your-productivity-with-enhanced-security-and-privacy/",
  ]);
  expect(
    cards
      .find(".portfolio-card__description")
      .map((_, description) => $(description).text())
      .get(),
  ).toEqual([
    "I worked on Microsoft Copilot for Windows, focusing on generative experiences that enable users to create interactive web apps with AI. I also improved the app's accessibility, helping make Copilot more inclusive and usable across a wider range of needs.",
    "I worked on the Microsoft 365 Companion apps for Windows, including People Companion. These lightweight apps provide quick access to Microsoft 365 experiences, such as finding and connecting with colleagues directly from the Windows taskbar.",
    "I worked on the enterprise experience for the Microsoft Edge new tab page, helping users quickly discover and access relevant workplace content, tools, and resources from their browser.",
    "I worked on the Cortana app for Windows, Microsoft's personal productivity assistant, helping users manage tasks, access information, and stay productive through a conversational experience.",
  ]);
  const expectedTags = [
    ["Windows", "Microsoft", "AI", "Accessibility", "User Interface"],
    ["Windows", "Microsoft", "User Interface"],
    ["Windows", "Microsoft", "Browser", "User Interface"],
    ["Windows", "Microsoft", "User Interface"],
  ];
  cards.each((index, card) => {
    expect(
      $(card)
        .find(".tags__link")
        .map((_, tag) => $(tag).text())
        .get(),
    ).toEqual(expectedTags[index]);
  });
  const tagLinks = new Map(
    cards
      .find(".tags__link")
      .toArray()
      .map((tag) => [$(tag).text(), $(tag).attr("href")!]),
  );
  for (const [tag, path] of tagLinks) {
    const tagResponse = await request.get(path);
    expect(tagResponse.ok(), `${tag} tag page`).toBe(true);
    const tagged = load(await tagResponse.text());
    if (tag === "AI") {
      expect(tagged(".tag-page > h1").text()).toBe("# AI");
      expect(tagged(".post-card")).toHaveLength(0);
      const sitemap = await request.get("/sitemap.md");
      expect(sitemap.ok()).toBe(true);
      expect(await sitemap.text()).toContain(
        "https://rehansaeed.com/tag/ai.md",
      );
    } else {
      expect(
        tagged(".post-card").length,
        `${tag} has published posts`,
      ).toBeGreaterThan(0);
    }
  }
  expect(cards.find("figcaption")).toHaveLength(0);
  expect(cards.text()).not.toContain("Screenshot:");
  expect(
    cards
      .find(".portfolio-card__image")
      .map((_, image) => ({
        width: Number($(image).attr("width")),
        height: Number($(image).attr("height")),
      }))
      .get(),
  ).toEqual([
    { width: 3840, height: 2160 },
    { width: 3072, height: 1728 },
    { width: 1430, height: 929 },
    { width: 1560, height: 880 },
  ]);
  for (const source of [
    "/images/hero/Microsoft-365-Companions-3072x1728.jpg",
    cards.eq(1).find(".portfolio-card__image").attr("src")!,
  ]) {
    const imageResponse = await request.get(source);
    expect(imageResponse.ok()).toBe(true);
    await expectFilledCompanionCorners(await imageResponse.body());
  }
  const graph = JSON.parse($('script[type="application/ld+json"]').text());
  const list = graph["@graph"].find(
    (node: { "@type": string }) => node["@type"] === "ItemList",
  );
  expect(list.itemListElement.map((item: { url: string }) => item.url)).toEqual(
    $(".portfolio-card__title a")
      .map((_, link) => $(link).attr("href"))
      .get(),
  );
});

for (const width of [375, 1280]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`Portfolio badges follow titles at ${width}px in ${colorScheme} mode`, async ({
      page,
      request,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      await page.route("https://img.shields.io/**", (route) => {
        const label = new URL(route.request().url()).searchParams.get("label");
        const badgeWidth = label ? 70 + label.length * 6 : 100;
        return route.fulfill({
          contentType: "image/svg+xml",
          body: `<svg xmlns="http://www.w3.org/2000/svg" width="${badgeWidth}" height="20"><rect width="100%" height="100%" fill="#ddd"/></svg>`,
        });
      });
      await page.goto("/portfolio/");
      for (const id of ["portfolio-microsoft", "portfolio-open-source"]) {
        const heading = page.locator(`#${id}`);
        await expect(heading).toHaveCSS("text-align", "center");
        const offset = await heading.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          const section = element.parentElement!.getBoundingClientRect();
          return Math.abs(
            bounds.x + bounds.width / 2 - section.x - section.width / 2,
          );
        });
        expect(offset).toBeLessThanOrEqual(1);
      }
      const cards = page.locator(".portfolio__open-source .portfolio-card");
      await expect(cards).toHaveCount(repositories.length);
      const microsoftCards = page.locator(
        ".portfolio__microsoft .portfolio-card",
      );
      await expect(microsoftCards).toHaveCount(4);
      await expect(
        microsoftCards.locator(".portfolio-card__badges"),
      ).toHaveCount(0);
      await expect(microsoftCards.locator("figcaption")).toHaveCount(0);
      for (const image of await microsoftCards
        .locator(".portfolio-card__image")
        .all()) {
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate(
              (element: HTMLImageElement) =>
                element.complete && element.naturalWidth > 0,
            ),
          )
          .toBe(true);
        if (
          (await image.getAttribute("alt")) === "Microsoft 365 Companion Apps"
        ) {
          const source = await image.evaluate(
            (element: HTMLImageElement) => element.currentSrc,
          );
          const imageResponse = await request.get(source);
          expect(imageResponse.ok()).toBe(true);
          await expectFilledCompanionCorners(await imageResponse.body());
        }
      }
      const bashHero = cards.getByRole("img", {
        name: "Bash Cheat Sheet",
        exact: true,
      });
      await bashHero.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          bashHero.evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
        )
        .toBe(true);
      const heroBox = await bashHero.boundingBox();
      expect(heroBox!.width / heroBox!.height).toBeCloseTo(1600 / 900, 2);
      for (const card of await cards.all()) {
        await card.scrollIntoViewIfNeeded();
        const permalink = await card
          .locator(".portfolio-card__title a")
          .getAttribute("href");
        expect(permalink).toBeTruthy();
        const repository = new URL(permalink!).pathname.slice(1);
        expect(repositories).toContain(repository);
        expect(
          await card
            .locator(
              ".portfolio-card__content > .portfolio-card__title, .portfolio-card__content > .portfolio-card__badges, .portfolio-card__content > .portfolio-card__description",
            )
            .evaluateAll((elements) =>
              elements.map((element) =>
                element.matches(".portfolio-card__title")
                  ? "title"
                  : element.matches(".portfolio-card__badges")
                    ? "badges"
                    : "description",
              ),
            ),
        ).toEqual(["title", "badges", "description"]);
        for (const [kind, destination] of [
          ["stars", "stargazers"],
          ["forks", "forks"],
        ]) {
          const badge = card.locator(`.portfolio-card__${kind}`);
          await expect(badge).toHaveAttribute(
            "src",
            `https://img.shields.io/github/${kind}/${repository}?style=social`,
          );
          await expect(badge.locator("..")).toHaveAttribute(
            "href",
            `${permalink}/${destination}`,
          );
          await expect(badge).not.toHaveAttribute("width");
          await expect(badge).toHaveAttribute("height", "30");
        }
        const packages = nugetPackages[repository] ?? [];
        await expect(card.locator(".portfolio-card__downloads")).toHaveCount(
          packages.length,
        );
        for (const id of packages) {
          const link = card.locator(
            `.portfolio-card__nuget[href="https://www.nuget.org/packages/${id}"]`,
          );
          const badge = link.locator(".portfolio-card__downloads");
          const count = Number(await link.getAttribute("data-downloads"));
          await expect(badge).toHaveAttribute(
            "alt",
            `${id}: ${count} total NuGet downloads at last build`,
          );
          const url = new URL((await badge.getAttribute("src"))!);
          expect(url.origin).toBe("https://img.shields.io");
          expect(url.pathname).toBe(`/nuget/dt/${id}`);
          expect(url.searchParams.get("style")).toBe("social");
          expect(url.searchParams.get("logo")).toBe("nuget");
          expect(url.searchParams.get("label")).toBe(id);
          await expect(badge.locator("..")).toHaveAttribute(
            "href",
            `https://www.nuget.org/packages/${id}`,
          );
          await expect(badge).not.toHaveAttribute("width");
          await expect(badge).toHaveAttribute("height", "30");
          const style = await link.evaluate((element) => ({
            border: getComputedStyle(element).borderTopWidth,
            padding: getComputedStyle(element).paddingTop,
          }));
          expect(style.border).toBe("0px");
          expect(style.padding).toBe("0px");
        }
        if (packages.length) {
          const rows = await card.evaluate((element) => ({
            githubTop: element
              .querySelector(".portfolio-card__github")!
              .getBoundingClientRect().top,
            nugetBottom: element
              .querySelector(".portfolio-card__nuget-badges")!
              .getBoundingClientRect().bottom,
            display: getComputedStyle(
              element.querySelector(".portfolio-card__badges")!,
            ).display,
            direction: getComputedStyle(
              element.querySelector(".portfolio-card__badges")!,
            ).flexDirection,
            gap: Number.parseFloat(
              getComputedStyle(
                element.querySelector(".portfolio-card__badges")!,
              ).rowGap,
            ),
          }));
          expect(rows.display).toBe("flex");
          expect(rows.direction).toBe("column");
          expect(rows.gap).toBeGreaterThanOrEqual(16);
          expect(rows.githubTop - rows.nugetBottom).toBeCloseTo(rows.gap, 1);
          const wrapping = await card
            .locator(".portfolio-card__nuget-badges")
            .evaluate((group) => ({
              display: getComputedStyle(group).display,
              wrap: getComputedStyle(group).flexWrap,
              gap: Number.parseFloat(getComputedStyle(group).columnGap),
              width: group.getBoundingClientRect().width,
              widths: [...group.children].map(
                (element) => element.getBoundingClientRect().width,
              ),
              tops: [...group.children].map(
                (element) => element.getBoundingClientRect().top,
              ),
            }));
          expect(wrapping.display).toBe("flex");
          expect(wrapping.wrap).toBe("wrap");
          expect(wrapping.gap).toBeGreaterThanOrEqual(12);
          if (packages.length > 1) {
            if (
              wrapping.widths[0]! + wrapping.widths[1]! + wrapping.gap <=
              wrapping.width + 1
            ) {
              expect(wrapping.tops[1]).toBeCloseTo(wrapping.tops[0]!, 1);
            } else {
              expect(wrapping.tops[1]).toBeGreaterThan(wrapping.tops[0]!);
            }
          }
        }
        const overflow = await card
          .locator(".portfolio-card__badges")
          .evaluate((group) => group.scrollWidth - group.clientWidth);
        expect(overflow).toBe(0);
      }
      const geometry = await cards.first().evaluate((card) => {
        const content = card.querySelector(".portfolio-card__content")!;
        const badges = card.querySelector(".portfolio-card__badges")!;
        const description = card.querySelector(".portfolio-card__description")!;
        return {
          display: getComputedStyle(content).display,
          gap: Number.parseFloat(getComputedStyle(content).rowGap),
          actualGap:
            description.getBoundingClientRect().top -
            badges.getBoundingClientRect().bottom,
          badgeSizes: [...badges.querySelectorAll("img")].map((badge) => ({
            width: badge.getBoundingClientRect().width,
            height: badge.getBoundingClientRect().height,
            maximumWidth: badges.getBoundingClientRect().width,
          })),
          descriptionMargin: getComputedStyle(description).marginBlockStart,
        };
      });
      expect(geometry.display).toBe("grid");
      expect(geometry.gap).toBeGreaterThan(0);
      expect(geometry.actualGap).toBeCloseTo(geometry.gap, 1);
      expect(geometry.descriptionMargin).toBe("0px");
      for (const size of geometry.badgeSizes) {
        expect(size.height).toBe(30);
        expect(size.width).toBeGreaterThan(0);
        expect(size.width).toBeLessThanOrEqual(size.maximumWidth);
      }
      for (const badge of await cards.locator(".portfolio-card__badge").all()) {
        const image = await badge.evaluate((element: HTMLImageElement) => ({
          width: element.getBoundingClientRect().width,
          naturalWidth: element.naturalWidth,
          naturalHeight: element.naturalHeight,
          available: element
            .closest(".portfolio-card__badges")!
            .getBoundingClientRect().width,
        }));
        expect(image.naturalHeight).toBe(20);
        const largeWidth = (image.naturalWidth / image.naturalHeight) * 30;
        expect(image.width).toBeCloseTo(
          Math.min(largeWidth, image.available),
          1,
        );
      }
      for (const link of await cards
        .first()
        .locator(".portfolio-card__badges a")
        .all()) {
        await link.scrollIntoViewIfNeeded();
        expect(
          await link.evaluate((anchor) => {
            const rect = anchor.getBoundingClientRect();
            return (
              document
                .elementFromPoint(
                  rect.x + rect.width / 2,
                  rect.y + rect.height / 2,
                )
                ?.closest("a") === anchor
            );
          }),
        ).toBe(true);
        await link.focus();
        await expect(link).toBeFocused();
      }
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(width);
    });
  }
}
