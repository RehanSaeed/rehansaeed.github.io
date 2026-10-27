<template>
  <div class="portfolio">
    <header class="portfolio__title">
      <u-heading id="portfolio" level="1" center :to="relativeUrl"
        >Portfolio</u-heading
      >
      <p>
        A selection of products I worked on at Microsoft and open source
        projects I've started and maintained. There are many others I've
        contributed to which you can see in my GitHub profile.
      </p>
    </header>

    <u-arrows class="portfolio__arrows" />

    <section
      class="portfolio__section portfolio__microsoft"
      aria-labelledby="portfolio-microsoft">
      <u-heading id="portfolio-microsoft" level="2" center
        >Contributions at Microsoft</u-heading
      >
      <div class="portfolio__items">
        <u-portfolio-card
          v-for="item of microsoftProjects"
          :key="item.id"
          :portfolio="item" />
      </div>
    </section>

    <section
      class="portfolio__section portfolio__open-source"
      aria-labelledby="portfolio-open-source">
      <u-heading id="portfolio-open-source" level="2" center
        >Open Source</u-heading
      >
      <u-portfolio-statistics />
      <div class="portfolio__items">
        <u-portfolio-card
          v-for="item of openSourceProjects"
          :key="item.id"
          :portfolio="item" />
      </div>
    </section>
  </div>
</template>

<script setup>
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
    .order("nugetDownloads", "DESC")
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
      "nugetDownloads",
      "kind",
      "position",
    )
    .all(),
);
const microsoftProjects = computed(() =>
  (portfolio.value ?? [])
    .filter((project) => project.kind === "microsoft")
    .toSorted((a, b) => a.position - b.position),
);
const openSourceProjects = computed(() =>
  (portfolio.value ?? []).filter((project) => project.kind === "open-source"),
);
useSchemaOrg([
  defineWebPage({ "@type": "CollectionPage", name: title }),
  defineItemList({
    itemListElement: [
      ...microsoftProjects.value,
      ...openSourceProjects.value,
    ].map((project) => ({
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

.portfolio__section {
  display: grid;
  gap: var(--global-space-fluid-5);
}

.portfolio__section > h2 {
  margin-block: 0;
}
</style>
