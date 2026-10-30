<template>
  <u-link-button bordered :to="url">
    <u-icon name="fa-brands:github" inline />
    Edit on GitHub
  </u-link-button>
</template>

<script lang="ts">
import type { PropType } from "vue";
import type { PostContent } from "~/types/content";

export default defineComponent({
  name: "u-edit-post-button",
  props: {
    post: {
      type: Object as PropType<Pick<PostContent, "stem" | "extension">>,
      required: true,
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
});
</script>
