<template>
  <ContentBox class="post-card" tag="article" hoverable :class="{'post-card--has-poster' : post.poster}">
    <div class="post-card__header">
      <g-image alt="Cover image" v-if="post.cover_image" class="post-card__image" :src="post.cover_image"/>
    </div>
    <div class="post-card__content">
      <h2 class="post-card__title" v-html="post.title" />
      <p class="post-card__description" v-html="post.description" />

      <Meta class="post-card__meta" :meta="post" />
      <Tags v-if="post.tags" class="post-card__tags" :tags="post.tags" />

      <g-link class="post-card__link" :to="post.path">Link</g-link>
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
    post: Object,
  },
}
</script>

<style lang="scss">
.post-card {
  margin-bottom: var(--space);
  position: relative;
}

.post-card__header {
  margin-left: calc(var(--space) * -1);
  margin-right: calc(var(--space) * -1);
  margin-bottom: calc(var(--space) / 2);
  margin-top: calc(var(--space) * -1);
  overflow: hidden;
  border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;

  &:empty {
    display: none;
  }
}

.post-card__image {
  min-width: 100%;
}

.post-card__title {
  margin-top: 0;
}

.post-card__tags {
  margin-top: 1.5rem;
  z-index: 1;
  position: relative;
}

.post-card__link {
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
