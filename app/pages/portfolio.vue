<template>
  <div class="portfolio">
    <header class="portfolio__title">
      <u-heading id="portfolio" level="1" center :to="relativeUrl"
        >Portfolio</u-heading
      >
      <p>
        These are some of the open source projects that I've started and
        maintained. There are many others I've contributed to which you can see
        in my GitHub profile and of course there are other commercial projects
        that I cannot disclose.
      </p>
    </header>

    <u-arrows class="portfolio__arrows" />

    <div class="portfolio__items">
      <u-portfolio-card
        v-for="item of portfolio"
        :key="item.id"
        :portfolio="item" />
    </div>
  </div>
</template>

<script setup>
import UArrows from "~/components/shared/arrows.vue";
import UHeading from "~/components/shared/heading.vue";
import UPortfolioCard from "~/components/portfolio-card.vue";

const site = useAppConfig().site;
const title = "Portfolio";
const description = `Portfolio of work by ${site.author.name}.`;
const relativeUrl = "/portfolio/";
const url = site.url + relativeUrl;
useBlogOgImage(title);

useHead({
  title,
  link: [{ rel: "canonical", href: url }],
  meta: [
    { name: "description", content: description },
    { name: "author", content: site.author.name },
    // Open Graph
    { property: "og:title", content: title },
    { property: "og:url", content: url },
    { property: "og:description", content: description },
    { property: "og:locale", content: site.language.replace("-", "_") },
    { property: "og:site_name", content: site.name },
    { property: "og:type", content: "website" },
    { property: "fb:app_id", content: site.facebookAppId },
  ],
});

const { data: portfolio } = await useAsyncData("portfolio", () =>
  queryCollection("portfolio")
    .where("published", "=", true)
    .order("stars", "DESC")
    .order("title", "ASC")
    .select(
      "id",
      "title",
      "description",
      "heroImage",
      "permalink",
      "tags",
      "repository",
      "stars",
      "forks",
      "nugetPackages",
    )
    .all(),
);
useSchemaOrg([
  defineWebPage({ "@type": "CollectionPage", name: title }),
  defineItemList({
    itemListElement: (portfolio.value ?? []).map((project) => ({
      name: project.title,
      url: project.permalink,
    })),
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: "Blog", item: site.url + "/" },
      { name: title, item: url },
    ],
  }),
]);
</script>

<style lang="scss">
.portfolio {
  display: grid;
  gap: var(--global-space-fluid-5);
  grid-template-columns: 1fr;
}

.portfolio__title {
  display: grid;
  justify-items: center;
  text-align: center;
}

.portfolio__arrows {
  margin-inline: calc(var(--global-space-main) * -1);
}

.portfolio__items {
  display: grid;
  gap: var(--global-space-fluid-5);
  grid-template-columns: repeat(
    auto-fit,
    minmax(
      min(var(--global-space-content-min-width), 100%),
      var(--global-space-content-max-width)
    )
  );
  justify-content: center;
}
</style>
