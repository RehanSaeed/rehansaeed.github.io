<template>
  <article class="webmention-link">
    <a class="webmention-link__author" :href="url">{{ name }}</a>
    <u-time class="webmention-link__timestamp" :datetime="timestamp" />
  </article>
</template>

<script>
import time from "~/components/shared/time.vue";

export default {
  name: "u-webmention-link",
  components: {
    "u-time": time,
  },
  props: {
    link: {
      required: true,
      type: Object,
    },
  },
  computed: {
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

  color: var(--global-title-color);
  font-family: var(--global-font-family-heading);
  text-decoration: none;

  &:hover,
  &:focus,
  &:active {
    color: var(--global-title-color);
    opacity: 0.7;
  }

  &:visited {
    color: var(--global-title-color);
  }
}

.webmention-link__timestamp {
  grid-area: timestamp;
  align-self: center;
  font-size: var(--global-font-size-1);
}
</style>
