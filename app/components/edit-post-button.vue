<template>
  <u-link-button bordered :to="url">
    <u-icon-github inline /> Edit on GitHub
  </u-link-button>
</template>

<script>
import linkButton from "~/components/shared/link-button.vue";
import iconGitHub from "~/components/shared/icons/icon-github.vue";

export default {
  name: "u-edit-post-button",
  components: {
    "u-link-button": linkButton,
    "u-icon-github": iconGitHub,
  },
  props: {
    post: {
      type: Object,
    },
  },
  setup() {
    return { metadata: useAppConfig().site };
  },
  computed: {
    url() {
      const { url, branch } = this.metadata.repository;
      return `${url}/tree/${branch}/content/${this.post.stem}.${this.post.extension}`;
    },
  },
};
</script>
