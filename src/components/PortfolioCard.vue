<template>
  <ContentBox class="portfolio-card" tag="article" hoverable>
    <div class="portfolio-card__header">
      <g-image :alt="portfolio.title" v-if="portfolio.cover_image" class="portfolio-card__image" :src="portfolio.cover_image"/>
    </div>
    <div class="portfolio-card__content">
      <h2 class="portfolio-card__title" v-html="portfolio.title" />
      <p class="portfolio-card__description" v-html="portfolio.description" />

      <Meta class="portfolio-card__meta" :meta="portfolio" />
      <Tags v-if="portfolio.tags" class="portfolio-card__tags" :tags="portfolio.tags" />

      <g-link class="portfolio-card__link" :to="portfolio.permalink">Link</g-link>
    </div>
  </ContentBox>
</template>

<script>
import ContentBox from '~/components/ContentBox';
import Meta from '~/components/Meta';
import Tags from '~/components/Tags';

export default {
  components: {
    ContentBox,
    Meta,
    Tags,
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
  margin-left: calc(var(--space) * -1);
  margin-right: calc(var(--space) * -1);
  margin-bottom: calc(var(--space) / 2);
  margin-top: calc(var(--space) * -1);
  overflow: hidden;
  border-radius: var(--radius) var(--radius) 0 0;

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
  margin-top: 1.5rem;
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
