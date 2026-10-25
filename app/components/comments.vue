<template>
  <u-intersect @enterFirstTime="refresh">
    <u-card class="comments" aria-labelledby="comments">
      <header class="comments__header">
        <u-heading
          id="comments"
          class="comments__title"
          center
          level="2"
          href="#comments"
          >GitHub Comments</u-heading
        >
        <div class="comments__summary">
          <div class="comments__toolbar">
            <h3 class="comments__count">
              {{ current.comments.length }}
              {{ current.comments.length === 1 ? "Comment" : "Comments" }}
            </h3>
            <u-link-button class="comments__github" bordered :href="issueUrl">
              <u-icon name="fa-brands:github" inline aria-hidden="true" />
              Comment on GitHub
            </u-link-button>
          </div>
          <p v-if="unavailable" class="comments__status" role="status">
            Live comments unavailable; showing saved comments. You can view the
            latest on GitHub.
          </p>
        </div>
      </header>
      <div class="comments__list">
        <article
          v-for="{ comment, association, reactions, edited } in comments"
          :id="`github-comment-${comment.id}`"
          :key="comment.id"
          class="github-comment"
          :class="{ 'github-comment--without-avatar': !comment.user }"
          :aria-labelledby="`github-comment-author-${comment.id}`">
          <u-avatar
            v-if="comment.user"
            class="github-comment__avatar"
            :href="comment.user.html_url"
            :label="comment.user.login"
            :alt="comment.user.login"
            :src="comment.user.avatar_url"
            loading="lazy" />
          <div class="github-comment__body">
            <header class="github-comment__header">
              <div class="github-comment__identity">
                <u-heading
                  :id="`github-comment-author-${comment.id}`"
                  class="github-comment__author"
                  :href="comment.user?.html_url ?? comment.html_url"
                  level="3"
                  size="6"
                  >{{ comment.user?.login ?? "Deleted user" }}</u-heading
                >
                <u-badge
                  v-if="association"
                  class="github-comment__association"
                  >{{ association }}</u-badge
                >
              </div>
              <div class="github-comment__timestamp">
                <u-time :datetime="comment.created_at" />
                <span v-if="edited" class="github-comment__edited">
                  (edited <u-time :datetime="edited" />)
                </span>
              </div>
            </header>
            <!-- eslint-disable-next-line vue/no-v-html -- safeComment sanitizes both saved and refreshed GitHub markup. -->
            <div class="github-comment__content" v-html="comment.body_html" />
            <footer v-if="reactions.length" class="github-comment__footer">
              <ul
                class="github-comment__reactions"
                aria-label="Reactions"
                role="list">
                <li
                  v-for="reaction in reactions"
                  :key="reaction.name"
                  class="github-comment__reaction-item">
                  <u-badge
                    class="github-comment__reaction"
                    role="img"
                    :aria-label="`${reaction.label}: ${reaction.count}`"
                    :title="`${reaction.label}: ${reaction.count}`">
                    <span
                      class="github-comment__reaction-emoji"
                      aria-hidden="true"
                      >{{ reaction.emoji }}</span
                    >
                    <span
                      class="github-comment__reaction-count"
                      aria-hidden="true"
                      >{{ reaction.count }}</span
                    >
                  </u-badge>
                </li>
              </ul>
            </footer>
          </div>
        </article>
      </div>
    </u-card>
  </u-intersect>
</template>

<script setup lang="ts">
import {
  commentAssociation,
  commentReactions,
} from "~/utils/comment-presentation";
import type { CommentSnapshot } from "#shared/utils/comments";

defineOptions({ name: "BlogComments" });
const props = defineProps<{ title: string; snapshot: CommentSnapshot }>();
const current = shallowRef(props.snapshot);
const comments = computed(() =>
  current.value.comments.map((comment) => ({
    comment,
    association: commentAssociation(comment.author_association),
    reactions: commentReactions(comment),
    edited:
      comment.updated_at !== comment.created_at
        ? comment.updated_at
        : undefined,
  })),
);
const unavailable = ref(false);
const repository = useAppConfig().site.repository;
const controller = new AbortController();
onBeforeUnmount(() => controller.abort());
const issueUrl = computed(() => {
  const query = new URLSearchParams({
    title: `[Comment] ${props.title}`,
    labels: "comment",
  });
  return (
    current.value.issue?.html_url ?? `${repository.url}/issues/new?${query}`
  );
});
async function refresh() {
  try {
    const { refreshComments } = await import("~/utils/comments");
    current.value = await refreshComments(
      `${repository.owner}/${repository.name}`,
      props.title,
      current.value,
      controller.signal,
    );
  } catch (error) {
    if (controller.signal.aborted) return;
    console.warn(
      "[comments] Live refresh unavailable; retaining static snapshot:",
      error,
    );
    unavailable.value = true;
  }
}
</script>

<style lang="scss">
@use "~/assets/style/abstracts/type";

.comments {
  display: grid;
  gap: var(--global-space-fixed-5);
  min-inline-size: 0;
  content-visibility: auto;
  contain-intrinsic-size: 427px;
}

.comments__title {
  margin-block: 0;
}

.comments__list {
  display: grid;
  gap: var(--global-space-fixed-5);
  min-inline-size: 0;
}

.comments__header {
  display: grid;
  gap: var(--global-space-fixed-4);
}

.comments__summary {
  display: grid;
  gap: var(--global-space-fixed-4);
  padding-block-end: var(--global-space-fixed-4);
  border-block-end: var(--global-border-width-1) solid
    var(--global-border-color);
}

.comments__status {
  margin: 0;
  min-inline-size: 0;
}

.comments__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--global-space-fixed-2);
}

.comments__count {
  flex-grow: 1;
  margin: 0;
  min-inline-size: 0;
}

.github-comment {
  display: grid;
  column-gap: var(--global-space-fixed-4);
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas: "avatar body";
  scroll-margin-block-start: var(--global-space-fixed-6);

  @include type.word-wrap();
}

.github-comment--without-avatar {
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "body";
}

.github-comment__avatar {
  grid-area: avatar;
  align-self: start;
  margin: 0;
}

.github-comment__body {
  grid-area: body;
  display: grid;
  gap: var(--global-space-fixed-3);
  min-inline-size: 0;
}

.github-comment__header {
  display: grid;
}

.github-comment__identity {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--global-space-fixed-2);
  min-inline-size: 0;
}

.github-comment__author {
  margin: 0;
  min-inline-size: 0;
}

.github-comment__timestamp {
  font-size: var(--global-font-size-1);
}

.github-comment__edited {
  display: inline-block;
}

.comments__github {
  flex: none;
  min-inline-size: 0;
  max-inline-size: 100%;
  text-align: center;

  &:focus-visible {
    outline: var(--global-border-width-2) solid var(--global-accent-color);
    outline-offset: var(--global-space-fixed-1);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover,
    &:focus {
      transform: none;
    }
  }
}

.github-comment__content {
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

.github-comment__reactions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--global-space-fixed-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.github-comment__reaction-item {
  display: flex;
  margin: 0;
}

.github-comment__reaction {
  gap: var(--global-space-fixed-2);
}

.github-comment__reaction-emoji {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 1em;
  block-size: 1em;
  flex: none;
}

.github-comment__reaction-count {
  font-variant-numeric: tabular-nums;
}
</style>
