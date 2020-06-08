<template>
  <article class="webmention-reply">
    <a class="webmention-reply__image-link" :href="reply.data.url">
      <g-image class="webmention-reply__image"
        :alt="reply.data.author.name"
        :src="reply.data.author.photo"
        height="60"
        width="60"/>
    </a>
    <a class="webmention-reply__author" :href="reply.data.url">{{reply.data.author.name}}</a>
    <span class="webmention-reply__timestamp">{{timestamp}}</span>
    <div class="webmention-reply__content" v-html="reply.data.content"></div>
  </article>
</template>

<script>
import { getDisplayDateFromString } from '~/framework/date.js';

export default {
  name: 'u-webmention-reply',
  props: {
    reply: {
      required: true,
      type: Object,
    }
  },
  computed: {
    timestamp() { return getDisplayDateFromString(this.reply.data.published); }
  }
}
</script>

<style lang="scss">
.webmention-reply {
  display: grid;
  grid-column-gap: var(--global-space-fixed-3);
  grid-template-areas:
    "image author timestamp"
    "image content content";
  grid-template-columns: auto  auto 1fr;
}

.webmention-reply__image-link {
  grid-area: image;
}
.webmention-reply__image {
  border: var(--global-border-width-2) solid var(--global-body-color);
  display: block;
  border-radius: 50%;
  object-fit: cover;
  transition: opacity ease-out var(--global-duration-2);
  height: var(--global-space-fixed-6);
  width: var(--global-space-fixed-6);

  &:hover,
  &:focus,
  &:active {
    opacity: .7;
  }
}

.webmention-reply__author {
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

.webmention-reply__timestamp {
  grid-area: timestamp;
  font-size: var(--global-font-size-1);
}

.webmention-reply__content {
  grid-area: content;

  > p:last-of-type {
    margin-bottom: 0;
  }
}
</style>
