<template>
  <u-link-button bordered :to="url">
    <u-icon name="fa-brands:github" inline />
    Edit on GitHub
  </u-link-button>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { PostsCollectionItem } from "@nuxt/content";
export default defineComponent({
  name: "u-edit-post-button",
  props: {
    /** Post metadata used to render this component. */ post: {
      type: Object as PropType<Pick<PostsCollectionItem, "stem" | "extension">>,
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
