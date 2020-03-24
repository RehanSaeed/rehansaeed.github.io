<template>
  <ContentBox class="portfolio-card">
    <div class="portfolio-card__header">
      <g-image alt="Cover image" v-if="portfolio.cover_image" class="portfolio-card__image" :src="portfolio.cover_image" />
    </div>
    <div class="portfolio-card__content">
      <h2 class="portfolio-card__title" v-html="portfolio.title" />
      <p class="portfolio-card__description" v-html="portfolio.description" />

      <PortfolioMeta class="portfolio-card__meta" :portfolio="portfolio" />
      <PortfolioTags class="portfolio-card__tags" :portfolio="portfolio" />

      <g-link class="portfolio-card__link" :to="portfolio.permalink">Link</g-link>
    </div>
  </ContentBox>
</template>

<script>
import ContentBox from '~/components/ContentBox'
import PortfolioMeta from '~/components/PortfolioMeta'
import PortfolioTags from '~/components/PortfolioTags'

export default {
  components: {
    ContentBox,
    PortfolioMeta,
    PortfolioTags
  },
  props: ['portfolio'],
}
</script>

<style lang="scss">
.portfolio-card {
  margin-bottom: var(--space);
  position: relative;

  &__header {
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

  &__image {
    min-width: 100%;
  }

  &__title {
    margin-top: 0;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 1px 10px 30px 0 rgba(0,0,0,.1);
  }

  &__tags {
    z-index: 1;
    position: relative;
  }

  &__link {
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
}
</style>
