<template>
  <u-content-box class="portfolio-card" tag="article" hoverable>
    <div class="portfolio-card__header">
      <g-image :alt="portfolio.title" v-if="portfolio.heroImage" class="portfolio-card__image" :src="portfolio.heroImage"/>
    </div>
    <div class="portfolio-card__content">
      <u-heading level="2" class="portfolio-card__title">{{portfolio.title}}</u-heading>
      <p class="portfolio-card__description">{{portfolio.description}}</p>

      <u-tags v-if="portfolio.tags" class="portfolio-card__tags" :tags="portfolio.tags" />

      <g-link class="portfolio-card__link" :to="portfolio.permalink">Link</g-link>
    </div>
  </u-content-box>
</template>

<script>
import contentBox from '~/components/shared/content-box.vue';
import heading from '~/components/shared/heading.vue';
import tags from '~/components/tags.vue';

export default {
  name: 'u-portfolio-card',
  components: {
    'u-content-box': contentBox,
    'u-heading': heading,
    'u-tags': tags,
  },
  props: {
    portfolio: Object,
  }
}
</script>

<style lang="scss">
.portfolio-card {
  position: relative;
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
  z-index: 1;
  position: relative;
}

.portfolio-card__link {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.0;
  overflow: hidden;
  text-indent: -9999px;
  z-index: 0;
}
</style>
