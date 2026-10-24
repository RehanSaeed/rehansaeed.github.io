<template>
  <u-link-button bordered :to="url">
    <NuxtIcon name="fa-brands:github" class="icon--inline" aria-hidden="true" />
    Edit on GitHub
  </u-link-button>
</template>

<script>
import { NuxtIcon } from "#components";
import linkButton from "~/components/shared/link-button.vue";

export default {
  name: "u-edit-post-button",
  components: {
    NuxtIcon,
    "u-link-button": linkButton,
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
