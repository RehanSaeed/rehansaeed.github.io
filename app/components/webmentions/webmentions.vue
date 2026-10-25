<template>
  <u-intersect @enterFirstTime="onLoadMentions">
    <u-card
      class="webmentions"
      tag="section"
      aria-labelledby="webmentions"
      :aria-busy="isLoading">
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
        <u-button
          class="webmentions__retry"
          variant="secondary"
          @click="onLoadMentions">
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
          <ul
            v-if="!isLoading"
            class="webmentions__links-container"
            aria-label="Links"
            role="list">
            <li v-for="link of links" :key="link.id">
              <u-webmention-link :link="link" />
            </li>
          </ul>
          <u-webmention-links-skeleton v-else />
        </div>

        <div class="webmentions__replies">
          <h3 class="webmentions__count webmentions__reply-count">
            {{ repliesDescription }}
          </h3>
          <ol
            v-if="!isLoading"
            class="webmentions__replies-container"
            aria-label="Replies"
            role="list">
            <li v-for="reply of replies" :key="reply.id">
              <u-webmention-reply :reply="reply" />
            </li>
          </ol>
          <u-webmention-replies-skeleton v-else />
        </div>
      </div>
    </u-card>
  </u-intersect>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { z } from "zod";
import {
  webMentionSchema,
  webMentionTimestamp,
  webMentionUrl,
  type WebMention,
} from "#shared/utils/webmentions";
defineOptions({ name: "u-webmentions" });
const props = defineProps({
  /** Canonical URL associated with this component. */ url: {
    required: true,
    type: String,
  },
});
const isLoading = ref(true);
const hasError = ref(false);
const likes = ref<WebMention[]>([]);
const reposts = ref<WebMention[]>([]);
const links = ref<WebMention[]>([]);
const replies = ref<WebMention[]>([]);
const likesDescription = computed(
  () =>
    `${likes.value.length} ${pluralise(likes.value.length, "Like", "Likes")}`,
);
const repostsDescription = computed(
  () =>
    `${reposts.value.length} ${pluralise(reposts.value.length, "Repost", "Reposts")}`,
);
const linksDescription = computed(() => `${links.value.length} Linked`);
const repliesDescription = computed(
  () =>
    `${replies.value.length} ${pluralise(replies.value.length, "Reply", "Replies")}`,
);

const pluralise = (count: number, one: string, many: string) => {
  return count === 1 ? one : many;
};
const getMentions = async (page: number, perPage: number) => {
  const response = await fetch(
    `https://webmention.io/api/mentions?page=${page}&per-page=${perPage}&target=${props.url}&sort-by=published&sort-dir=up`,
  );
  if (!response.ok) {
    throw new Error(`Unable to load Web Mentions: HTTP ${response.status}`);
  }
  const responseBody: unknown = await response.json();
  const list = z
    .object({ links: z.array(webMentionSchema) })
    .parse(responseBody);
  for (const mention of list.links) {
    if (mention.activity.type === "link" || mention.activity.type === "reply") {
      webMentionUrl(mention);
      webMentionTimestamp(mention);
    }
  }
  return list.links;
};
const onLoadMentions = async () => {
  try {
    isLoading.value = true;
    hasError.value = false;
    const mentions = await getMentions(0, 999);
    likes.value = mentions.filter((x) => x.activity.type === "like");
    reposts.value = mentions.filter((x) => x.activity.type === "repost");
    links.value = mentions.filter(
      (x) =>
        x.activity.type === "link" && !(x.data.author && x.data.author.photo),
    );
    replies.value = mentions.filter(
      (x) =>
        x.activity.type === "reply" ||
        (x.activity.type === "link" && x.data.author && x.data.author.photo),
    );
  } catch (error) {
    hasError.value = true;
    console.error("Unable to load Web Mentions", error);
  } finally {
    isLoading.value = false;
  }
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
