<template>
  <u-intersect @enterFirstTime="onEnterFirstTime">
    <u-card class="webmentions">
      <u-heading
        id="webmentions"
        class="webmentions__title"
        center
        level="2"
        href="#webmentions"
        >Web Mentions</u-heading
      >
      <a
        class="webmentions__help"
        href="https://en.wikipedia.org/wiki/Webmention">
        <u-icon-question inline /> What's this?
      </a>
      <div class="webmentions__container">
        <u-webmention-faces
          v-if="!isLoading"
          class="webmentions__like-faces"
          :mentions="likes">
          <h3 class="webmentions__count webmentions__like-count">
            {{ likesDescription }}
          </h3>
        </u-webmention-faces>
        <u-webmention-faces-skeleton v-else />

        <u-webmention-faces
          v-if="!isLoading"
          class="webmentions__repost-faces"
          :mentions="reposts">
          <h3 class="webmentions__count webmentions__repost-count">
            {{ repostsDescription }}
          </h3>
        </u-webmention-faces>
        <u-webmention-faces-skeleton v-else />

        <div class="webmentions__links">
          <h3 class="webmentions__count webmentions__link-count">
            {{ linksDescription }}
          </h3>
          <div
            v-if="!isLoading && !isLinksEmpty"
            class="webmentions__links-container">
            <u-webmention-link
              v-for="link of links"
              :key="link.id"
              :link="link" />
          </div>
          <u-webmention-links-skeleton v-if="isLoading" />
        </div>

        <div class="webmentions__replies">
          <h3 class="webmentions__count webmentions__reply-count">
            {{ repliesDescription }}
          </h3>
          <div
            v-if="!isLoading && !isRepliesEmpty"
            class="webmentions__replies-container">
            <u-webmention-reply
              v-for="reply of replies"
              :key="reply.id"
              :reply="reply" />
          </div>
          <u-webmention-replies-skeleton v-if="isLoading" />
        </div>
      </div>
    </u-card>
  </u-intersect>
</template>

<script>
import card from "~/components/shared/card.vue";
import heading from "~/components/shared/heading.vue";
import intersect from "~/components/shared/intersect.vue";
import iconQuestion from "~/components/shared/icons/icon-question.vue";
import webmentionFaces from "~/components/webmentions/webmention-faces.vue";
import webmentionFacesSkeleton from "~/components/webmentions/webmention-faces-skeleton.vue";
import webmentionLink from "~/components/webmentions/webmention-link.vue";
import webmentionLinksSkeleton from "~/components/webmentions/webmention-links-skeleton.vue";
import webmentionReply from "~/components/webmentions/webmention-reply.vue";
import webmentionRepliesSkeleton from "~/components/webmentions/webmention-replies-skeleton.vue";

export default {
  name: "u-webmentions",
  components: {
    "u-card": card,
    "u-heading": heading,
    "u-intersect": intersect,
    "u-icon-question": iconQuestion,
    "u-webmention-faces": webmentionFaces,
    "u-webmention-faces-skeleton": webmentionFacesSkeleton,
    "u-webmention-link": webmentionLink,
    "u-webmention-links-skeleton": webmentionLinksSkeleton,
    "u-webmention-reply": webmentionReply,
    "u-webmention-replies-skeleton": webmentionRepliesSkeleton,
  },
  data() {
    return {
      isLoading: true,
      likes: [],
      reposts: [],
      links: [],
      replies: [],
    };
  },
  props: {
    url: {
      required: true,
      type: String,
    },
  },
  computed: {
    isLinksEmpty() {
      return this.links.length === 0;
    },
    isRepliesEmpty() {
      return this.replies.length === 0;
    },
    likesDescription() {
      return `${this.likes?.length ?? 0} ${this.pluralise(
        this.likes?.length,
        "Like",
        "Likes"
      )}`;
    },
    repostsDescription() {
      return `${this.reposts?.length ?? 0} ${this.pluralise(
        this.reposts?.length,
        "Repost",
        "Reposts"
      )}`;
    },
    linksDescription() {
      return `${this.links?.length ?? 0} Linked`;
    },
    repliesDescription() {
      return `${this.replies?.length ?? 0} ${this.pluralise(
        this.replies?.length,
        "Reply",
        "Replies"
      )}`;
    },
  },
  methods: {
    pluralise(count, one, many) {
      return count === 1 ? one : many;
    },
    async getMentions(page, perPage) {
      const response = await fetch(
        `https://webmention.io/api/mentions?page=${page}&per-page=${perPage}&target=${this.url}&sort-by=published&sort-dir=up`
      );
      const list = await response.json();
      return list.links;
    },
    async onEnterFirstTime() {
      try {
        this.isLoading = true;
        const mentions = await this.getMentions(0, 999);
        this.likes = mentions.filter((x) => x.activity.type === "like");
        this.reposts = mentions.filter((x) => x.activity.type === "repost");
        this.links = mentions.filter(
          (x) =>
            x.activity.type === "link" &&
            !(x.data.author && x.data.author.photo)
        );
        this.replies = mentions.filter(
          (x) =>
            x.activity.type === "reply" ||
            (x.activity.type === "link" && x.data.author && x.data.author.photo)
        );
      } catch (error) {
        console.log(error);
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

.webmentions {
  display: grid;

  content-visibility: auto;
  contain-intrinsic-size: 704px;
}

.webmentions__title {
  grid-column: 1;
  grid-row: 1;

  margin-block-start: 0;
}

.webmentions__help {
  grid-column: 1;
  grid-row: 1;
  align-self: center;
  justify-self: end;
  margin-block-end: var(--global-space-fixed-4);
}

@include breakpoints.respond-below(md) {
  .webmentions__help {
    grid-row: 2;
    justify-self: start;
  }
}

.webmentions__container {
  display: grid;
  gap: var(--global-space-fixed-5);
}

.webmentions__count {
  margin-block-start: 0;
}
.webmentions__like-count,
.webmentions__repost-count {
  min-width: 10.35rem;
}

.webmentions__help,
.webmentions__count {
  display: grid;
  align-items: center;
  gap: var(--global-space-fixed-2);
  grid-template-columns: auto 1fr;

  margin-block-end: 0;
}

.webmentions__links {
  display: grid;
  gap: var(--global-space-fixed-2);
}
.webmentions__links-container {
  display: grid;
  gap: var(--global-space-fixed-3);
}

.webmentions__replies {
  display: grid;
  gap: var(--global-space-fixed-2);
}
.webmentions__replies-container {
  display: grid;
  gap: var(--global-space-fixed-3);
}
</style>
