<template>
  <ContentBox class="portfolio-card" tag="article" hoverable>
    <div class="portfolio-card__header">
      <g-image :alt="portfolio.title" v-if="portfolio.cover_image" class="portfolio-card__image" :src="portfolio.cover_image"/>
    </div>
    <div class="portfolio-card__content">
      <Heading level="2" class="portfolio-card__title" v-html="portfolio.title" />
      <p class="portfolio-card__description" v-html="portfolio.description" />

      <Tags v-if="portfolio.tags" class="portfolio-card__tags" :tags="portfolio.tags" />

      <g-link class="portfolio-card__link" :to="portfolio.permalink">Link</g-link>
    </div>
  </ContentBox>
</template>

<script>
import ContentBox from '~/components/ContentBox';
import Heading from '~/components/shared/Heading';
import Meta from '~/components/Meta';
import Tags from '~/components/Tags';

export default {
  components: {
    ContentBox,
    Heading,
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
  border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
  margin-left: var(--global-space--5);
  margin-right: var(--global-space--5);
  margin-bottom: var(--global-space-4);
  margin-top: var(--global-space--5);
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
