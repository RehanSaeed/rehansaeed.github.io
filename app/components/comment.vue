<template>
  <article
    :id="`comment-${comment.id}`"
    class="comment"
    :class="{ 'comment--without-avatar': !comment.user }"
    :aria-labelledby="`comment-author-${comment.id}`">
    <u-avatar
      v-if="comment.user"
      class="comment__avatar"
      :href="comment.user.html_url"
      :label="comment.user.login"
      :alt="comment.user.login"
      :src="comment.user.avatar_url"
      loading="lazy" />
    <div class="comment__body">
      <header class="comment__header">
        <div class="comment__identity">
          <u-heading
            :id="`comment-author-${comment.id}`"
            class="comment__author"
            :href="comment.user?.html_url ?? comment.html_url"
            level="3"
            size="6"
            >{{ comment.user?.login ?? "Deleted user" }}</u-heading
          >
          <u-badge v-if="association" class="comment__association">{{
            association
          }}</u-badge>
        </div>
        <div class="comment__timestamp">
          <u-time :datetime="comment.created_at" />
          <span v-if="edited" class="comment__edited">
            (edited <u-time :datetime="edited" />)
          </span>
        </div>
      </header>
      <!-- eslint-disable-next-line vue/no-v-html -- safeComment sanitizes both saved and refreshed GitHub markup. -->
      <div class="comment__content" v-html="comment.body_html" />
      <footer v-if="reactions.length" class="comment__footer">
        <ul class="comment__reactions" aria-label="Reactions" role="list">
          <li
            v-for="reaction in reactions"
            :key="reaction.name"
            class="comment__reaction-item">
            <u-badge
              class="comment__reaction"
              role="img"
              :aria-label="`${reaction.label}: ${reaction.count}`"
              :title="`${reaction.label}: ${reaction.count}`">
              <span class="comment__reaction-emoji" aria-hidden="true">{{
                reaction.emoji
              }}</span>
              <span class="comment__reaction-count" aria-hidden="true">{{
                reaction.count
              }}</span>
            </u-badge>
          </li>
        </ul>
      </footer>
    </div>
  </article>
</template>

<script setup lang="ts">
import {
  commentAssociation,
  commentReactions,
} from "~/utils/comment-presentation";
import type { GitHubComment } from "#shared/utils/comments";

const props = defineProps<{ comment: GitHubComment }>();
const association = computed(() =>
  commentAssociation(props.comment.author_association),
);
const reactions = computed(() => commentReactions(props.comment));
const edited = computed(() =>
  props.comment.updated_at !== props.comment.created_at
    ? props.comment.updated_at
    : undefined,
);
</script>

<style lang="scss">
@use "~/assets/style/abstracts/type";

.comment {
  display: grid;
  column-gap: var(--global-space-fixed-4);
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas: "avatar body";
  scroll-margin-block-start: var(--global-space-fixed-6);

  @include type.word-wrap();
}

.comment--without-avatar {
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "body";
}

.comment__avatar {
  grid-area: avatar;
  align-self: start;
  margin: 0;
}

.comment__body {
  grid-area: body;
  display: grid;
  gap: var(--global-space-fixed-3);
  min-inline-size: 0;
}

.comment__header {
  display: grid;
}

.comment__identity {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--global-space-fixed-2);
  min-inline-size: 0;
}

.comment__author {
  margin: 0;
  min-inline-size: 0;
}

.comment__timestamp {
  font-size: var(--global-font-size-1);
}

.comment__edited {
  display: inline-block;
}

.comment__content {
  display: grid;
  gap: var(--global-space-fixed-5);
  min-inline-size: 0;

  > * {
    margin-block: 0;
    min-inline-size: 0;
  }

  p {
    min-inline-size: 0;
  }

  img {
    // Keep HTML dimensions or intrinsic sizing instead of the global full width.
    inline-size: revert-layer;
  }

  > :is(ul, ol) > li:first-child > :first-child {
    margin-block-start: 0;
  }

  > :is(ul, ol) > li:last-child,
  > :is(ul, ol) > li:last-child > :last-child {
    margin-block-end: 0;
  }

  pre {
    max-inline-size: 100%;
    overflow: auto;
  }
}

.comment__reactions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--global-space-fixed-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.comment__reaction-item {
  display: flex;
  margin: 0;
}

.comment__reaction {
  gap: var(--global-space-fixed-2);
}

.comment__reaction-emoji {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 1em;
  block-size: 1em;
  flex: none;
}

.comment__reaction-count {
  font-variant-numeric: tabular-nums;
}
</style>
