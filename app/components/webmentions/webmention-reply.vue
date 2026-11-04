<template>
  <article class="webmention-reply">
    <u-avatar
      class="webmention-reply__avatar"
      :href="url"
      rel="ugc nofollow"
      :label="name"
      :alt="name"
      :src="photo" />
    <u-heading
      class="webmention-reply__author"
      :id="id"
      :href="url"
      rel="ugc nofollow"
      level="3"
      size="6"
      >{{ name }}</u-heading
    >
    <u-time class="webmention-reply__timestamp" :datetime="timestamp" />
    <!-- eslint-disable-next-line vue/no-v-html -- Preserve the configured aggregator's HTML reply format. -->
    <div class="webmention-reply__content" v-ugc-links v-html="content"></div>
  </article>
</template>

<script setup lang="ts">
import { computed, type ObjectDirective, type PropType } from "vue";
import {
  webMentionTimestamp,
  webMentionUrl,
  type WebMention,
} from "#shared/utils/webmentions";
defineOptions({ name: "u-webmention-reply" });
const applyUgcLinks = (element: HTMLElement) => {
  for (const link of element.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    link.relList.add("ugc", "nofollow");
  }
};
const vUgcLinks: ObjectDirective<HTMLElement> = {
  mounted: applyUgcLinks,
  updated: applyUgcLinks,
};
const props = defineProps({
  /** Web mention reply to display. */ reply: {
    required: true,
    type: Object as PropType<WebMention>,
  },
});
const id = computed(() => `webmention-reply-${props.reply.id}`);
const url = computed(() => webMentionUrl(props.reply));
const content = computed(() => {
  if (
    props.reply.activity.type === "link" &&
    new URL(url.value).origin !== "https://twitter.com"
  ) {
    return props.reply.activity.sentence_html;
  } else {
    return props.reply.data.content;
  }
});
const name = computed(() => props.reply.data.author?.name || "Anonymous");
const photo = computed(() => props.reply.data.author?.photo || "");
const timestamp = computed(() => webMentionTimestamp(props.reply));
</script>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

.webmention-reply {
  display: grid;
  column-gap: var(--global-space-fixed-3);
  grid-template-areas:
    "avatar author"
    "avatar timestamp"
    "avatar content";
  grid-template-columns: auto 1fr;

  @include breakpoints.respond-above(md) {
    grid-template-areas:
      "avatar author timestamp"
      "avatar content content";
    grid-template-columns: auto auto 1fr;
  }
}

.webmention-reply__avatar {
  grid-area: avatar;
}

.webmention-reply__author {
  grid-area: author;
  margin: 0;
}

.webmention-reply__timestamp {
  grid-area: timestamp;
  align-self: center;
  font-size: var(--global-font-size-1);
}

.webmention-reply__content {
  grid-area: content;

  > p:last-of-type {
    margin-block-end: 0;
  }
}
</style>
