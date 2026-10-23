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
          await expect(badge).toHaveAttribute("width", "104");
          await expect(badge).toHaveAttribute("height", "20");
        }
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
