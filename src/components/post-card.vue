<template>
  <u-content-box class="post-card" tag="article" hoverable :class="{'post-card--has-poster' : post.poster}">
    <div class="post-card__header">
      <g-image v-if="post.heroImage"
        class="post-card__image"
        :alt="imageMeta.alt"
        :src="post.heroImage"/>
    </div>
    <div class="post-card__content">
      <u-heading level="2" class="post-card__title">{{post.title}}</u-heading>
      <p class="post-card__description">{{post.description}}</p>

      <u-post-meta class="post-card__meta" :meta="post" />
      <!-- <u-tags v-if="post.tags" class="post-card__tags" :tags="post.tags" /> -->

      <g-link class="post-card__link" :to="post.path">Link</g-link>
    </div>
  </u-content-box>
</template>

<script>
import contentBox from '~/components/shared/content-box.vue';
import heading from '~/components/shared/heading.vue';
import postMeta from '~/components/post-meta.vue';
import tags from '~/components/tags.vue';
import { getImageMetadata } from '~/framework/images.js';

export default {
  name: 'u-post-card',
  components: {
    'u-content-box': contentBox,
    'u-heading': heading,
    'u-post-meta': postMeta,
    'u-tags': tags,
  },
  props: {
    post: {
      type: Object,
    },
  },
  computed: {
    imageMeta: function() { return getImageMetadata(this.post.heroImage); },
  },
}
</script>

<style lang="scss">
.post-card {
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
  margin-top: var(--global-space-fixed-4);
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
