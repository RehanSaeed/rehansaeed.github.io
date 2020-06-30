<template>
  <article class="webmention-reply">
    <u-avatar
      class="webmention-reply__avatar"
      :href="url"
      :label="name"
      :alt="name"
      :src="photo"
      size="large"/>
    <a class="webmention-reply__author" :href="url">{{name}}</a>
    <span class="webmention-reply__timestamp">{{timestamp}}</span>
    <div class="webmention-reply__content" v-html="content"></div>
  </article>
</template>

<script>
import avatar from '~/components/shared/avatar.vue';
import { getDisplayDateFromString } from '~/framework/date.js';

export default {
  name: 'u-webmention-reply',
  components: {
    'u-avatar': avatar,
  },
  props: {
    reply: {
      required: true,
      type: Object,
    }
  },
  computed: {
    url() { return this.reply.data.url; },
    content() { return this.reply.data.content; },
    name() { return this.reply.data.author.name; },
    photo() { return this.reply.data.author.photo; },
    timestamp() { return getDisplayDateFromString(this.reply.data.published); }
  }
}
</script>

<style lang="scss">
.webmention-reply {
  display: grid;
  grid-column-gap: var(--global-space-fixed-3);
  grid-template-areas:
    "avatar author"
    "avatar timestamp"
    "avatar content";
  grid-template-columns: auto 1fr;

  @media screen and (min-width: 768px) { // $global-breakpoint-md
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
