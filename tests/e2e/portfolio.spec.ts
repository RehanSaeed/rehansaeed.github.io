import { load } from "cheerio";
import { expect, test } from "./fixtures";

const repositories = [
  "Dotnet-Boxed/Templates",
  "RehanSaeed/Bash-Cheat-Sheet",
  "Dotnet-Boxed/Framework",
  "RehanSaeed/Schema.NET",
  "RehanSaeed/EditorConfig",
  "RehanSaeed/Serilog.Exceptions",
  "RehanSaeed/.NET-Big-O-Algorithm-Complexity-Cheat-Sheet",
  "RehanSaeed/Kubernetes-Cheat-Sheet",
  "RehanSaeed/HttpClientSample",
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
  const cards = $(".portfolio-card");
  expect(cards).toHaveLength(repositories.length);
  const stars = cards
    .map((_, card) =>
      Number(
        $(card)
          .find(".portfolio-card__stars")
          .attr("alt")
          ?.match(/: (\d+) GitHub stars at last build$/)?.[1],
      ),
    )
    .get();
  expect(stars.every((count) => Number.isInteger(count) && count >= 0)).toBe(
    true,
  );
  expect(stars).toEqual([...stars].sort((a, b) => b - a));
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
  });
});

for (const width of [375, 1280]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`Portfolio badges follow titles at ${width}px in ${colorScheme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      await page.goto("/portfolio/");
      const cards = page.locator(".portfolio-card");
      await expect(cards).toHaveCount(repositories.length);
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
          await expect(badge).toHaveAttribute("width", "156");
          await expect(badge).toHaveAttribute("height", "30");
        }
        const packages = nugetPackages[repository] ?? [];
        await expect(card.locator(".portfolio-card__downloads")).toHaveCount(
          packages.length,
        );
        for (const id of packages) {
          const badge = card.getByRole("img", {
            name: `${id} total NuGet downloads`,
            exact: true,
          });
          const url = new URL((await badge.getAttribute("src"))!);
          expect(url.origin).toBe("https://img.shields.io");
          expect(url.pathname).toBe(`/nuget/dt/${id}`);
          expect(url.searchParams.get("style")).toBe("social");
          expect(url.searchParams.get("logo")).toBe("nuget");
          expect(url.searchParams.get("label")).toBeTruthy();
          await expect(badge.locator("..")).toHaveAttribute(
            "href",
            `https://www.nuget.org/packages/${id}`,
          );
          await expect(badge).toHaveAttribute("width", "300");
          await expect(badge).toHaveAttribute("height", "30");
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
            maximumWidth: badge.classList.contains("portfolio-card__downloads")
              ? 300
              : 156,
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
