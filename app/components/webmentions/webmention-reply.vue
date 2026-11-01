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
      level="4"
      size="6"
      >{{ name }}</u-heading
    >
    <u-time class="webmention-reply__timestamp" :datetime="timestamp" />
    <!-- eslint-disable-next-line vue/no-v-html -- Preserve the configured aggregator's HTML reply format. -->
    <div class="webmention-reply__content" v-ugc-links v-html="content"></div>
  </article>
</template>

<script>
export default {
  name: "u-webmention-reply",
  directives: {
    ugcLinks(element) {
      for (const link of element.querySelectorAll("a[href]")) {
        link.relList.add("ugc", "nofollow");
      }
    },
  },
  props: {
    /** Web mention reply to display. */
    reply: {
      required: true,
      type: Object,
    },
  },
  computed: {
    id() {
      return `webmention-reply-${this.reply.id}`;
    },
    url() {
      return this.reply.data.url;
    },
    content() {
      if (
        this.reply.activity.type === "link" &&
        !this.reply.data.url.startsWith("https://twitter.com")
      ) {
        return this.reply.activity.sentence_html;
      } else {
        return this.reply.data.content;
      }
    },
    name() {
      return this.reply.data.author.name;
    },
    photo() {
      return this.reply.data.author.photo;
    },
    timestamp() {
      return this.reply.data.published;
    },
  },
};
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
