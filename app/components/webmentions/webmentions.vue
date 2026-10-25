<template>
  <u-intersect @enterFirstTime="onLoadMentions">
    <u-card class="webmentions" :aria-busy="isLoading">
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
        <u-icon name="fa-regular:question-circle" inline />
        What's this?
      </a>
      <div v-if="hasError" class="webmentions__error">
        <p role="alert">Unable to load Web Mentions. Please try again.</p>
        <u-button class="webmentions__retry" bordered @click="onLoadMentions">
          <u-icon name="feather:rotate-cw" />
          Retry
        </u-button>
      </div>
      <div v-else class="webmentions__container">
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
          <div v-if="!isLoading" class="webmentions__links-container">
            <u-webmention-link
              v-for="link of links"
              :key="link.id"
              :link="link" />
          </div>
          <u-webmention-links-skeleton v-else />
        </div>

        <div class="webmentions__replies">
          <h3 class="webmentions__count webmentions__reply-count">
            {{ repliesDescription }}
          </h3>
          <div v-if="!isLoading" class="webmentions__replies-container">
            <u-webmention-reply
              v-for="reply of replies"
              :key="reply.id"
              :reply="reply" />
          </div>
          <u-webmention-replies-skeleton v-else />
        </div>
      </div>
    </u-card>
  </u-intersect>
</template>

<script lang="ts">
import type { Webmention } from "~/types/webmentions";

export default defineComponent({
  name: "u-webmentions",
  data(): {
    isLoading: boolean;
    hasError: boolean;
    likes: Webmention[];
    reposts: Webmention[];
    links: Webmention[];
    replies: Webmention[];
  } {
    return {
      isLoading: true,
      hasError: false,
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
    likesDescription() {
      return `${this.likes?.length ?? 0} ${this.pluralise(
        this.likes?.length,
        "Like",
        "Likes",
      )}`;
    },
    repostsDescription() {
      return `${this.reposts?.length ?? 0} ${this.pluralise(
        this.reposts?.length,
        "Repost",
        "Reposts",
      )}`;
    },
    linksDescription() {
      return `${this.links?.length ?? 0} Linked`;
    },
    repliesDescription() {
      return `${this.replies?.length ?? 0} ${this.pluralise(
        this.replies?.length,
        "Reply",
        "Replies",
      )}`;
    },
  },
  methods: {
    pluralise(count: number, one: string, many: string) {
      return count === 1 ? one : many;
    },
    async getMentions(page: number, perPage: number) {
      const response = await fetch(
        `https://webmention.io/api/mentions?page=${page}&per-page=${perPage}&target=${this.url}&sort-by=published&sort-dir=up`,
      );
      if (!response.ok) {
        throw new Error(`Unable to load Web Mentions: HTTP ${response.status}`);
      }
      const list: { links: Webmention[] } = await response.json();
      if (!Array.isArray(list.links)) {
        throw new Error(
          "Invalid Web Mentions response: expected a links array",
        );
      }
      return list.links;
    },
    async onLoadMentions() {
      try {
        this.isLoading = true;
        this.hasError = false;
        const mentions = await this.getMentions(0, 999);
        this.likes = mentions.filter((x) => x.activity.type === "like");
        this.reposts = mentions.filter((x) => x.activity.type === "repost");
        this.links = mentions.filter(
          (x) =>
            x.activity.type === "link" &&
            !(x.data.author && x.data.author.photo),
        );
        this.replies = mentions.filter(
          (x) =>
            x.activity.type === "reply" ||
            (x.activity.type === "link" &&
              x.data.author &&
              x.data.author.photo),
        );
      } catch (error) {
        this.hasError = true;
        console.error("Unable to load Web Mentions", error);
      } finally {
        this.isLoading = false;
      }
    },
  },
});
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

.webmentions__retry {
  display: flex;
  align-items: center;
  gap: var(--global-space-fixed-2);
  margin-inline: auto;
}

.webmentions__count {
  margin-block-start: 0;
}
.webmentions__like-count,
.webmentions__repost-count {
  min-inline-size: 10.35rem;
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
}
.webmentions__links-container {
  display: grid;
  gap: var(--global-space-fixed-3);

  margin-block-start: var(--global-space-fixed-2);
}
.webmentions__links-container:empty {
  margin-block-start: 0;
}

.webmentions__replies {
  display: grid;
}
.webmentions__replies-container {
  display: grid;
  gap: var(--global-space-fixed-3);

  margin-block-start: var(--global-space-fixed-2);
}
.webmentions__replies-container:empty {
  margin-block-start: 0;
}
</style>
