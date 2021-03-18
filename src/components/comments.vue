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

.comments__title {
  margin-top: 0;
}

.vssue {
  display: grid;
  grid-gap: var(--global-space-fixed-5);
  overflow: hidden;

  p {
    min-width: 0;
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
  width: 1rem;
  height: 1rem;
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
  z-index: 101;
  cursor: pointer;
  top: 0;
  padding: var(--global-space-fixed-3) var(--global-space-fixed-4);
  width: 100%;
  color: var(--global-accent-color);
  border: var(--global-border-width-1) solid var(--global-accent-color);
  border-radius: var(--global-border-radius);
  background-color: var(--global-background-color);
}
.vssue .vssue-notice .vssue-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  background-color: var(--global-accent-color);
}
.vssue .vssue-status {
  text-align: center;
  padding-top: var(--global-space-fixed-4);
  padding-bottom: var(--global-space-fixed-3);
  color: var(--global-accent-color);
}
.vssue .vssue-status .vssue-status-info {
  margin-top: var(--global-space-fixed-3);
  margin-bottom: var(--global-space-fixed-3);
}

// Body
.vssue-body {
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: var(--global-space-fixed-4);
}

// New Comment
.vssue-new-comment {
  border-bottom: var(--global-border-width-1) solid var(--global-border-color);
  padding-bottom: var(--global-space-fixed-5);

  display: grid;
  grid-gap: var(--global-space-fixed-3);
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
      height: var(--global-space-fixed-6);
      width: var(--global-space-fixed-6);
      fill: var(--global-body-color);
    }
  }
}
.vssue-new-comment-body {
  grid-area: body;
}
.vssue-new-comment-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.vssue-new-comment-footer {
  grid-area: footer;

  display: grid;
  grid-gap: var(--global-space-fixed-3);
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
  width: 100%;
}

// Comment
.vssue-comments > div {
  display: grid;
  grid-gap: var(--global-space-fixed-4);
  grid-template-columns: 1fr;
}
.vssue-comment {
  display: grid;
  grid-gap: var(--global-space-fixed-3);
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
    width: var(--global-space-fixed-6);
    height: var(--global-space-fixed-6);
  }
}

// Comment Edit
.vssue
  .vssue-comments
  .vssue-comment.vssue-comment-edit-mode
  .vssue-comment-main {
  border-color: var(--global-accent-color);
  box-shadow: 0 0 3px 1px var(--global-accent-color);

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
  border-bottom: none;
  border-top-left-radius: var(--global-border-radius);
  border-top-right-radius: var(--global-border-radius);
  overflow: hidden;
  padding: var(--global-space-fixed-3) var(--global-space-fixed-4);
}
.vssue-comment-author a {
  color: var(--global-title-color);
  font-family: var(--global-font-family-heading);
  text-decoration: none;
}
.vssue-comment-created-at {
  float: right;
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
  width: 100%;
  padding: var(--global-space-fixed--4);
}

// Comment Footer
.vssue-comment-footer {
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-bottom-left-radius: var(--global-border-radius);
  border-bottom-right-radius: var(--global-border-radius);
  border-top: none;
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
  margin-right: var(--global-space-fixed-4);

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
  margin-left: var(--global-space-fixed-4);
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
