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
        <div
          class="comments__summary"
          :class="{
            'comments__summary--with-comments': current.comments.length > 0,
          }">
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
      <div v-if="current.comments.length" class="comments__list">
        <u-comment
          v-for="comment in current.comments"
          :key="comment.id"
          :comment="comment" />
      </div>
    </u-card>
  </u-intersect>
</template>

<script setup lang="ts">
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
    if (controller.signal.aborted) {
      return;
    }
    console.warn(
      "[comments] Live refresh unavailable; retaining static snapshot:",
      error,
    );
    unavailable.value = true;
  }
}
</script>

<style lang="scss">
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
}

.comments__summary--with-comments {
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
</style>
