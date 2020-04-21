<template>
  <u-content-box class="post-card" tag="article" hoverable :class="{'post-card--has-poster' : post.poster}">
    <div class="post-card__header">
      <g-image alt="Cover image" v-if="post.cover_image" class="post-card__image" :src="post.cover_image"/>
    </div>
    <div class="post-card__content">
      <u-heading level="2" class="post-card__title" v-html="post.title" />
      <p class="post-card__description" v-html="post.description" />

      <u-post-meta class="post-card__meta" :meta="post" />
      <Tags v-if="post.tags" class="post-card__tags" :tags="post.tags" />

      <g-link class="post-card__link" :to="post.path">Link</g-link>
    </div>
  </u-content-box>
</template>

<script>
import contentBox from '~/components/shared/content-box.vue';
import heading from '~/components/shared/heading.vue';
import postMeta from '~/components/post-meta.vue';
import Tags from '~/components/Tags.vue';

export default {
  components: {
    'u-content-box': contentBox,
    'u-heading': heading,
    'u-post-meta': postMeta,
    Tags,
  },
  props: {
    post: {
      type: Object,
    },
  },
}
</script>

<style lang="scss">
.post-card {
  margin-bottom: var(--global-space-fluid-6);
  position: relative;
}

.post-card__header {
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
