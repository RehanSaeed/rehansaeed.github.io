<template>
  <u-link-button variant="secondary" :to="url">
    <u-icon name="fa-brands:github" inline />
    Edit on GitHub
  </u-link-button>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";
import type { PostsCollectionItem } from "@nuxt/content";
defineOptions({ name: "u-edit-post-button" });
const props = defineProps({
  /** Post metadata used to render this component. */ post: {
    type: Object as PropType<Pick<PostsCollectionItem, "stem" | "extension">>,
    required: true,
  },
});
const metadata = useAppConfig().site;
const url = computed(() => {
  const { url, branch } = metadata.repository;
  return `${url}/tree/${branch}/content/${props.post.stem}.${props.post.extension}`;
});
</script>
