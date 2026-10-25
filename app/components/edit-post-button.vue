<template>
  <u-link-button bordered :to="url">
    <u-icon name="fa-brands:github" inline />
    Edit on GitHub
  </u-link-button>
</template>

<script>
export default {
  name: "u-edit-post-button",
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
