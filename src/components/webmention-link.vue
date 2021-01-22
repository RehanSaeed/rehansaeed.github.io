<template>
  <article class="webmention-link">
    <u-heading
      class="webmention-link__author"
      :id="id"
      :href="url"
      level="3"
      size="6"
      >{{ name }}</u-heading
    >
    <u-time class="webmention-link__timestamp" :datetime="timestamp" />
  </article>
</template>

<script>
import heading from "~/components/shared/heading.vue";
import time from "~/components/shared/time.vue";

export default {
  name: "u-webmention-link",
  components: {
    "u-heading": heading,
    "u-time": time,
  },
  props: {
    link: {
      required: true,
      type: Object,
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
};
</script>

<style lang="scss">
.webmention-link {
  display: grid;
  grid-column-gap: var(--global-space-fixed-3);
  grid-template-areas:
    "author"
    "timestamp";
  grid-template-columns: 1fr;

  @media screen and (min-width: 768px) {
    // $global-breakpoint-md
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
