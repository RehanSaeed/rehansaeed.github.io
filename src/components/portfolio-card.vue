<template>
  <u-card class="portfolio-card" tag="article" hoverable focusable>
    <div class="portfolio-card__header">
      <g-image
        :alt="portfolio.title"
        v-if="portfolio.heroImage"
        class="portfolio-card__image"
        :src="portfolio.heroImage"
      />
    </div>
    <div class="portfolio-card__content">
      <u-heading
        :id="portfolio.title"
        :to="portfolio.permalink"
        level="2"
        class="portfolio-card__title"
        >{{ portfolio.title }}</u-heading
      >
      <p class="portfolio-card__description">{{ portfolio.description }}</p>

      <u-tags
        v-if="portfolio.tags"
        class="portfolio-card__tags"
        :tags="portfolio.tags"
      />
    </div>
  </u-card>
</template>

<script>
import card from "~/components/shared/card.vue";
import heading from "~/components/shared/heading.vue";
import tags from "~/components/tags.vue";

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
};
</script>

<style lang="scss">
.portfolio-card {
  cursor: pointer;
}

.portfolio-card__header {
  border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
  margin-left: var(--global-space-fluid--6);
  margin-right: var(--global-space-fluid--6);
  margin-bottom: var(--global-space-fluid-5);
  margin-top: var(--global-space-fluid--6);
  overflow: hidden;

  &:empty {
    display: none;
  }
}

.portfolio-card__image {
  min-width: 100%;
}

.portfolio-card__title {
  margin-top: 0;
}

.portfolio-card__tags {
  margin-top: var(--global-space-fixed-4);
  position: relative;
  z-index: 1;
}
</style>
