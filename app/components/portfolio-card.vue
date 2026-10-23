<template>
  <u-card
    class="portfolio-card"
    :data-nuget-downloads="portfolio.nugetDownloads"
    tag="article"
    hoverable
    focusable>
    <figure class="portfolio-card__header">
      <NuxtImg
        :alt="portfolio.title"
        v-if="portfolio.heroImage"
        class="portfolio-card__image"
        :src="portfolio.heroImage"
        :width="imageMeta.width"
        :height="imageMeta.height"
        :sizes="contentImageSizes"
        densities="x1 x2"
        format="webp"
        loading="lazy" />
      <figcaption
        v-if="portfolio.heroImageSource"
        class="portfolio-card__image-credit">
        Screenshot:
        <a :href="portfolio.heroImageSource">Microsoft</a>
      </figcaption>
    </figure>
    <div class="portfolio-card__content">
      <u-heading
        :id="`portfolio-card-${portfolio.id}`"
        :to="portfolio.permalink"
        level="3"
        size="2"
        class="portfolio-card__title"
        >{{ portfolio.title }}</u-heading
      >
      <div
        v-if="portfolio.repository"
        class="portfolio-card__badges"
        role="group"
        :aria-label="`${portfolio.title} project statistics`">
        <div class="portfolio-card__github">
          <a :href="`${portfolio.permalink}/stargazers`">
            <img
              class="portfolio-card__badge portfolio-card__stars"
              :alt="`${portfolio.title}: ${portfolio.stars} GitHub stars at last build`"
              height="30"
              width="156"
              loading="lazy"
              :src="`https://img.shields.io/github/stars/${portfolio.repository}?style=social`" />
          </a>
          <a :href="`${portfolio.permalink}/forks`">
            <img
              class="portfolio-card__badge portfolio-card__forks"
              :alt="`${portfolio.title}: ${portfolio.forks} GitHub forks at last build`"
              height="30"
              width="156"
              loading="lazy"
              :src="`https://img.shields.io/github/forks/${portfolio.repository}?style=social`" />
          </a>
        </div>
        <div
          v-if="portfolio.nugetPackages.length"
          class="portfolio-card__nuget-badges">
          <a
            v-for="pkg of portfolio.nugetPackages"
            :key="pkg.id"
            class="portfolio-card__nuget"
            :data-downloads="pkg.downloads"
            :title="`${pkg.id}: ${pkg.downloads.toLocaleString('en-GB')} total NuGet downloads at last build`"
            :href="`https://www.nuget.org/packages/${pkg.id}`">
            <span class="portfolio-card__package">{{ pkg.id }}</span>
            <img
              class="portfolio-card__badge portfolio-card__downloads"
              :alt="`${pkg.id}: ${pkg.downloads} total NuGet downloads at last build`"
              height="30"
              width="192"
              loading="lazy"
              :src="`https://img.shields.io/nuget/dt/${pkg.id}?style=social&logo=nuget&label=Downloads`" />
          </a>
        </div>
      </div>
      <p class="portfolio-card__description">{{ portfolio.description }}</p>

      <u-tags
        v-if="portfolio.tags"
        class="portfolio-card__tags"
        :tags="portfolio.tags" />
    </div>
  </u-card>
</template>

<script>
import card from "~/components/shared/card.vue";
import heading from "~/components/shared/heading.vue";
import tags from "~/components/tags.vue";
import { getImageMetadata } from "~/framework/images.js";
import { contentImageSizes } from "#shared/utils/images";

export default {
  name: "u-portfolio-card",
  components: {
    "u-card": card,
    "u-heading": heading,
    "u-tags": tags,
  },
  props: {
    portfolio: {
      required: true,
      type: Object,
    },
  },
  computed: {
    contentImageSizes() {
      return contentImageSizes;
    },
    imageMeta() {
      return getImageMetadata(this.portfolio.heroImage);
    },
  },
};
</script>

<style lang="scss">
.portfolio-card {
  position: relative;
}

.portfolio-card__header {
  border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
  margin-inline: var(--global-space-fluid--6);
  margin-block-start: var(--global-space-fluid--6);
  margin-block-end: var(--global-space-fluid-5);
  overflow: hidden;

  &:empty {
    display: none;
  }
}

.portfolio-card__image {
  min-inline-size: 100%;
}

.portfolio-card__image-credit {
  position: relative;
  z-index: 1;
  padding: var(--global-space-fixed-2);
  font-size: 0.75em;
  text-align: center;
}

.portfolio-card__content {
  display: grid;
  gap: var(--global-space-fixed-4);
}

.portfolio-card__title,
.portfolio-card__description {
  margin-block: 0;
}

.portfolio-card__title a::after {
  content: "";

  position: absolute;
  inset: 0;
}

.portfolio-card__badges {
  display: grid;
  gap: var(--global-space-fixed-2);
  position: relative;
  z-index: 1;
}

.portfolio-card__github {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--global-space-fixed-2);
}

.portfolio-card__github a {
  flex: 0 1 calc((100% - var(--global-space-fixed-2)) / 2);
  min-inline-size: 0;
  max-inline-size: 156px;
}

.portfolio-card__nuget-badges {
  display: grid;
  gap: var(--global-space-fixed-2);
}

.portfolio-card__nuget {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--global-space-fixed-2);
  min-inline-size: 0;
  padding: var(--global-space-fixed-2);
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background-color: var(--global-background-color);
  text-decoration: none;
}

.portfolio-card__package {
  flex-basis: 100%;
  min-inline-size: 0;
  font-size: 0.875em;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.portfolio-card__badge {
  display: block;
  block-size: 30px;
  inline-size: 100%;
  object-fit: contain;
  object-position: left;
}

.portfolio-card__downloads {
  inline-size: 192px;
  max-inline-size: 100%;
}

.portfolio-card__tags {
  margin-block-start: 0;
  position: relative;
  z-index: 1;
}
</style>
