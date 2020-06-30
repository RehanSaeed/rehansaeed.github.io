<template>
  <article class="webmention-link">
    <a class="webmention-link__author" :href="url">{{name}}</a>
    <span class="webmention-link__timestamp">{{timestamp}}</span>
  </article>
</template>

<script>
import { getDisplayDateFromString } from '~/framework/date.js';

export default {
  name: 'u-webmention-link',
  props: {
    link: {
      required: true,
      type: Object,
    }
  },
  computed: {
    url() { return this.link.data.url; },
    name() { return (new URL(this.url)).hostname; },
    timestamp() { return getDisplayDateFromString(this.link.verified_date); }
  }
}
</script>

<style lang="scss">
.webmention-link {
  display: grid;
  grid-column-gap: var(--global-space-fixed-3);
  grid-template-areas:
    "author"
    "timestamp";
  grid-template-columns: 1fr;

  @media screen and (min-width: 768px) { // $global-breakpoint-md
    grid-template-areas:
      "author timestamp";
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
    opacity: .7;
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
