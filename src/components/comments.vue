<template>
  <u-card class="comments">
    <u-heading
      id="comments"
      class="comments__title"
      center
      level="2"
      href="#comments"
      >Comment</u-heading
    >
    <Vssue :title="title" />
  </u-card>
</template>

<script>
import card from "~/components/shared/card.vue";
import heading from "~/components/shared/heading.vue";

export default {
  name: "u-comments",
  components: {
    "u-card": card,
    "u-heading": heading,
  },
  props: {
    title: {
      type: String,
    },
  },
};
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

.vssue {
  display: grid;
  gap: var(--global-space-fixed-5);
  overflow: hidden;

  p {
    min-inline-size: 0;
  }
}

.vssue-header-comments-count {
  span::before {
    content: "Leave and View";
  }

  span::after {
    content: "Directly on GitHub.com";
  }
}

// Comment Count, Powered By
.vssue-header-powered-by {
  display: none;
}

// Icon
.vssue .vssue-icon {
  inline-size: 1rem;
  block-size: 1rem;
  vertical-align: -0.15rem;
  fill: var(--global-accent-color);
  overflow: hidden;
}
.vssue .vssue-icon-loading {
  animation: vssue-keyframe-rotation 1s linear infinite;
}
@-webkit-keyframes vssue-keyframe-rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes vssue-keyframe-rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Transitions
.vssue .fade-enter-active,
.vssue .fade-appear-active {
  transition: all 0.3s ease;
}
.vssue .fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.vssue .fade-enter,
.vssue .fade-leave-to,
.vssue .fade-appear {
  opacity: 0;
}

// Notice
.vssue .vssue-notice {
  position: relative;
  z-index: 100;
  transform: translateY(-11px);
}
.vssue .vssue-notice .vssue-alert {
  position: absolute;
  inset-block-start: 0;
  z-index: 101;

  cursor: pointer;
  padding: var(--global-space-fixed-3) var(--global-space-fixed-4);
  inline-size: 100%;
  color: var(--global-accent-color);
  border: var(--global-border-width-1) solid var(--global-accent-color);
  border-radius: var(--global-border-radius);
  background-color: var(--global-background-color);
}
.vssue .vssue-notice .vssue-progress {
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 0;
  block-size: 2px;
  background-color: var(--global-accent-color);
}
.vssue .vssue-status {
  text-align: center;
  padding-block-start: var(--global-space-fixed-4);
  padding-block-end: var(--global-space-fixed-3);
  color: var(--global-accent-color);
}
.vssue .vssue-status .vssue-status-info {
  margin-block: var(--global-space-fixed-3);
}

// Body
.vssue-body {
  display: grid;
  gap: var(--global-space-fixed-4);
  grid-template-columns: 1fr;
}

// New Comment
.vssue-new-comment {
  border-block-end: var(--global-border-width-1) solid
    var(--global-border-color);
  padding-block-end: var(--global-space-fixed-5);

  display: grid;
  gap: var(--global-space-fixed-3);
  grid-template-columns: auto 1fr;
  grid-template-areas:
    "avatar body"
    "avatar footer";

  // Disable New Comment Functionality - Hide new comment text box.
  display: none;

  .vssue-comment-avatar {
    grid-area: avatar;

    .vssue-icon {
      cursor: pointer;
      padding: 5px;
      inline-size: var(--global-space-fixed-6);
      block-size: var(--global-space-fixed-6);
      fill: var(--global-body-color);
    }
  }
}
.vssue-new-comment-body {
  grid-area: body;
}
.vssue-new-comment-loading {
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  transform: translate(-50%, -50%);
}
.vssue-new-comment-footer {
  grid-area: footer;

  display: grid;
  gap: var(--global-space-fixed-3);
  grid-template-columns: 1fr auto;
  grid-template-areas: "user operations";
}
.vssue-current-user {
  grid-area: user;
  align-self: center;
}
.vssue-current-user span {
  display: none;
}
.vssue-new-comment-operations {
  grid-area: operations;
}

// Comment Input
.vssue-new-comment-input {
  resize: none;
  inline-size: 100%;
}

// Comment
.vssue-comments > div {
  display: grid;
  gap: var(--global-space-fixed-4);
  grid-template-columns: 1fr;
}
.vssue-comment {
  display: grid;
  gap: var(--global-space-fixed-3);
  grid-template-columns: auto 1fr;
  grid-template-areas: "avatar body";

  @include type.word-wrap();
}

// Comment Avatar
.vssue-comment-avatar {
  grid-area: avatar;

  img {
    border: var(--global-border-width-1) solid var(--global-border-color);
    border-radius: var(--global-border-radius);
    inline-size: var(--global-space-fixed-6);
    block-size: var(--global-space-fixed-6);
  }
}

// Comment Edit
.vssue
  .vssue-comments
  .vssue-comment.vssue-comment-edit-mode
  .vssue-comment-main {
  border-color: var(--global-accent-color);
  box-shadow: var(--global-shadow-2);

  textarea:focus {
    border: none;
    box-shadow: none;
  }
}
.vssue .vssue-comments .vssue-comment.vssue-comment-disabled {
  pointer-events: none;
}

// Comment Body
.vssue-comment-body {
  grid-area: body;
}
.vssue-comment-body .vssue-comment.vssue-comment-disabled {
  background-color: var(--global-disabled-color);
}

// Comment Header
.vssue-comment-header {
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-block-end: none;
  border-start-start-radius: var(--global-border-radius);
  border-start-end-radius: var(--global-border-radius);
  overflow: hidden;
  padding: var(--global-space-fixed-3) var(--global-space-fixed-4);
}
.vssue-comment-author a {
  color: var(--global-title-color);
  font-family: var(--global-font-family-heading);
  text-decoration: none;
}
.vssue-comment-created-at {
  float: right; // Remove when browser support is good enough.
  float: inline-end;
}

// Comment Main
.vssue-comment-main {
  border: var(--global-border-width-1) solid var(--global-border-color);
  padding: var(--global-space-fixed-4);
}
.vssue-comment-main .vssue-edit-comment-input {
  background: transparent;
  border: none;
  resize: none;
  outline: none;
  inline-size: 100%;
  padding: var(--global-space-fixed--4);
}

// Comment Footer
.vssue-comment-footer {
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-bottom-left-radius: var(--global-border-radius);
  border-bottom-right-radius: var(--global-border-radius);
  border-block-start: none;
  overflow: hidden;
  padding: var(--global-space-fixed-3) var(--global-space-fixed-4);

  display: grid;
  grid-template-columns: auto auto;
}
.vssue-comment-hint {
  color: var(--global-placeholder-color);
}
.vssue-comment-reaction {
  color: var(--global-accent-color);
  cursor: pointer;
  display: inline-block;
  margin-inline-end: var(--global-space-fixed-4);

  // Disable New Comment Functionality - Disable click on buttons.
  cursor: default;
  pointer-events: none;
}
.vssue-comment-operations {
  color: var(--global-accent-color);
  justify-self: end;

  // Disable New Comment Functionality - Hide reply button.
  display: none;
}
.vssue
  .vssue-comments
  .vssue-comment
  .vssue-comment-footer
  .vssue-comment-operations
  .vssue-comment-operation {
  cursor: pointer;
  margin-inline-start: var(--global-space-fixed-4);
}
.vssue
  .vssue-comments
  .vssue-comment
  .vssue-comment-footer
  .vssue-comment-operations
  .vssue-comment-operation.vssue-comment-operation-muted {
  color: var(--global-placeholder-color);
}
.vssue
  .vssue-comments
  .vssue-comment
  .vssue-comment-footer
  .vssue-comment-operations
  .vssue-comment-operation.vssue-comment-operation-muted
  .vssue-icon {
  fill: var(--global-placeholder-color);
}

// Pagination
.vssue .vssue-pagination {
  display: none;
}
</style>
