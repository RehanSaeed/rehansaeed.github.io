<template>
  <article class="webmention-link">
    <u-heading
      class="webmention-link__author"
      :id="id"
      :href="url"
      rel="ugc nofollow"
      level="3"
      size="6"
      >{{ name }}</u-heading
    >
    <u-time class="webmention-link__timestamp" :datetime="timestamp" />
  </article>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";
import {
  webMentionTimestamp,
  webMentionUrl,
  type WebMention,
} from "#shared/utils/webmentions";
defineOptions({ name: "u-webmention-link" });
const props = defineProps({
  /** Web mention linking to the current content. */ link: {
    required: true,
    type: Object as PropType<WebMention>,
  },
});
const id = computed(() => `webmention-link-${props.link.id}`);
const url = computed(() => webMentionUrl(props.link));
const name = computed(() => new URL(url.value).hostname);
const timestamp = computed(() => webMentionTimestamp(props.link));
</script>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

.webmention-link {
  display: grid;
  column-gap: var(--global-space-fixed-3);
  grid-template-areas:
    "author"
    "timestamp";
  grid-template-columns: 1fr;

  @include breakpoints.respond-above(md) {
    grid-template-areas: "author timestamp";
    grid-template-columns: auto 1fr;
  }
}

.webmention-link__author {
  grid-area: author;
  margin: 0;
}

.webmention-link__timestamp {
  grid-area: timestamp;
  align-self: center;
  font-size: var(--global-font-size-1);
}
</style>
