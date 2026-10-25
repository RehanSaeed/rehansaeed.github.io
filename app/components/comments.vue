<template>
  <u-intersect @enterFirstTime="refresh">
    <u-card class="comments">
      <u-heading
        id="comments"
        class="comments__title"
        center
        level="2"
        href="#comments"
        >GitHub Comments</u-heading
      >
      <div class="vssue">
        <div class="comments__header">
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
          <p v-if="unavailable" role="status">
            Live comments unavailable; showing saved comments. You can view the
            latest on GitHub.
          </p>
        </div>
        <div class="vssue-comments">
          <article
            v-for="comment in current.comments"
            :id="`github-comment-${comment.id}`"
            :key="comment.id"
            class="vssue-comment">
            <u-avatar
              v-if="comment.user"
              class="vssue-comment-avatar"
              :href="comment.user.html_url"
              :label="comment.user.login"
              :alt="comment.user.login"
              :src="comment.user.avatar_url"
              loading="lazy" />
            <div class="vssue-comment-body">
              <header class="vssue-comment-header">
                <div class="vssue-comment-identity">
                  <u-heading
                    :id="`github-comment-author-${comment.id}`"
                    class="vssue-comment-author"
                    :href="comment.user?.html_url ?? comment.html_url"
                    level="3"
                    size="6"
                    >{{ comment.user?.login ?? "Deleted user" }}</u-heading
                  >
                  <u-badge
                    v-if="commentAssociation(comment.author_association)"
                    class="vssue-comment-badge"
                    >{{
                      commentAssociation(comment.author_association)
                    }}</u-badge
                  >
                </div>
                <div class="vssue-comment-created-at">
                  <u-time :datetime="comment.created_at" />
                  <span
                    v-if="
                      comment.updated_at &&
                      comment.updated_at !== comment.created_at
                    "
                    class="vssue-comment-edited">
                    (edited <u-time :datetime="comment.updated_at" />)
                  </span>
                </div>
              </header>
              <!-- eslint-disable-next-line vue/no-v-html -- safeComment sanitizes both saved and refreshed GitHub markup. -->
              <div class="vssue-comment-main" v-html="comment.body_html" />
              <footer
                v-if="commentReactions(comment).length"
                class="vssue-comment-footer"
                aria-label="Reactions">
                <u-badge
                  v-for="reaction in commentReactions(comment)"
                  :key="reaction.name"
                  class="vssue-comment-reaction"
                  role="img"
                  :aria-label="`${reaction.label}: ${reaction.count}`"
                  :title="`${reaction.label}: ${reaction.count}`">
                  <span
                    class="vssue-comment-reaction-emoji"
                    aria-hidden="true"
                    >{{ reaction.emoji }}</span
                  >
                  <span
                    class="vssue-comment-reaction-count"
                    aria-hidden="true"
                    >{{ reaction.count }}</span
                  >
                </u-badge>
              </footer>
            </div>
          </article>
        </div>
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
  content-visibility: auto;
  contain-intrinsic-size: 427px;
}

.comments__title {
  margin-block-start: 0;
}

.vssue,
.vssue-comments {
  display: grid;
  gap: var(--global-space-fixed-5);
  min-inline-size: 0;
}

.vssue p {
  min-inline-size: 0;
}

.comments__header {
  display: grid;
  gap: var(--global-space-fixed-4);
  padding-block-end: var(--global-space-fixed-4);
  border-block-end: var(--global-border-width-1) solid
    var(--global-border-color);
}

.comments__header p {
  margin: 0;
}

.comments__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--global-space-fixed-2);
}

.comments__count {
  margin: 0;
  min-inline-size: 0;
}

.vssue-comment {
  display: grid;
  column-gap: var(--global-space-fixed-4);
  grid-template-columns: auto minmax(0, 1fr);
  scroll-margin-block-start: var(--global-space-fixed-6);

  @include type.word-wrap();
}

.vssue-comment-avatar {
  grid-column: 1;
  grid-row: 1;
  align-self: start;
  margin: 0;
}

.vssue-comment-body {
  grid-column: 2;
  min-inline-size: 0;
}

.vssue-comment-header {
  display: grid;
  margin-block-end: var(--global-space-fixed-3);
}

.vssue-comment-identity {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--global-space-fixed-2);
  min-inline-size: 0;
}

.vssue-comment-author {
  margin: 0;
  min-inline-size: 0;
}

.vssue-comment-created-at {
  font-size: var(--global-font-size-1);
}

.vssue-comment-edited {
  display: inline-block;
}

.comments__github {
  flex: none;
  min-inline-size: 0;
  max-inline-size: 100%;
  margin-inline-start: auto;
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

.vssue-comment-main {
  display: flow-root;

  > :last-child {
    margin-block-end: 0;
  }
}

.vssue-comment-footer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--global-space-fixed-2);
  margin-block-start: var(--global-space-fixed-3);
}

.vssue-comment-reaction {
  gap: var(--global-space-fixed-2);
}

.vssue-comment-reaction-emoji {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 1em;
  block-size: 1em;
  flex: none;
}

.vssue-comment-reaction-count {
  font-variant-numeric: tabular-nums;
}
</style>
