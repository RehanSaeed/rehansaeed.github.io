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

<script lang="ts">
import type { PropType } from "vue";
import type { Webmention } from "~/types/webmentions";

export default defineComponent({
  name: "u-webmention-link",
  props: {
    link: {
      required: true,
      type: Object as PropType<Webmention>,
    },
  },
  computed: {
    id() {
      return `webmention-link-${this.link.id}`;
    },
    url() {
      return this.link.source;
    },
    name() {
      return new URL(this.url).hostname;
    },
    timestamp() {
      return this.link.data.published ?? this.link.verified_date;
    },
  },
});
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
