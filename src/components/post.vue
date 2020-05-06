<template>
  <u-content-box class="post" tag="article">

    <header class="post__header">
      <g-image v-if="post.heroImage"
        :alt="imageMeta.alt"
        :src="post.heroImage"/>
    </header>

    <div class="post__content" v-html="post.content" />

    <footer class="post__footer">
      <div class="post__footer__first-row">
        <u-share-button class="post__share" :title="post.title" :tags="post.tags.map(x => x.title)" />
        <u-edit-post-button class="post__edit" :post="post" />
      </div>
      <u-tags :tags="post.tags" class="post__tags" />
    </footer>

  </u-content-box>
</template>

<script>
import contentBox from '~/components/shared/content-box.vue';
import editPostButton from '~/components/edit-post-button.vue';
import shareButton from '~/components/share-button.vue';
import tags from '~/components/tags.vue';
import { getImageMetadata } from '~/framework/images.js';

export default {
  components: {
    'u-content-box': contentBox,
    'u-edit-post-button': editPostButton,
    'u-share-button': shareButton,
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
.post__header {
  border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
  margin-left: var(--global-space-fluid--6);
  margin-top: var(--global-space-fluid--6);
  margin-bottom: var(--global-space-fluid-5);
  overflow: hidden;
  width: calc(100% + var(--global-space-fluid-7));

  &:empty {
    display: none;
  }
}

.post__content {
  > h2:first-child {
    margin-top: 0;
  }

  > p:first-of-type {
    color: var(--global-title-color);
    font-size: var(--global-font-size-4);
    min-width: 0;

    &:first-letter {
      color: var(--global-accent-color);
      font-family: var(--global-font-family-serif);

      // initial-letter: 2; // Only supported by Safari
      // OR
      float: left;
      font-size: calc(var(--global-font-size-4) * 2.4);
      line-height: calc(var(--global-line-height-1) * .44);
      padding-right: var(--global-space-fixed-3);
      margin-top: .85rem;
    }
  }

  img {
    width: calc(100% + (2 * var(--global-space-fluid-6)));
    margin-left: var(--global-space-fluid--6);
    margin-right: var(--global-space-fluid--6);
    display: block;
    max-width: none;
  }

  div[style="width: 100%; margin: 25px 0 25px 0;"] div {
    margin-left: var(--global-space-fluid--6);
    margin-right: var(--global-space-fluid--6);
  }
}

.post__footer {
  display: grid;
  justify-items: start;
  margin-top: var(--global-space-fixed-6);
}

.post__footer__first-row {
  display: grid;
  grid-template-columns: auto auto 1fr;
  grid-gap: var(--global-space-fixed-3);
}

.post__edit,
.post__share {
  margin-bottom: var(--global-space-fixed-5);
}
</style>
