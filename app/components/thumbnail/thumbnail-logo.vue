<template>
  <div
    v-if="!noLogo"
    class="thumbnail-logo"
    :style="{ alignSelf: logoAlign, justifySelf: logoJustify }">
    <u-icon name="blog:rehan" class="thumbnail-logo__icon" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const route = useRoute();
const noLogo = ref(false);
const logoJustify = ref("");
const logoAlign = ref("");
onMounted(() => {
  const query = route.query;
  noLogo.value = Boolean(query["no-logo"]);
  logoJustify.value = String(query["logo-justify"] || "end");
  logoAlign.value = String(query["logo-align"] || "start");
});
</script>

<style lang="scss" scoped>
.thumbnail-logo {
  background: var(--global-background-color);
  border-radius: 50%;
  color: var(--global-accent-color);
  overflow: hidden;
  inline-size: 150px;
  block-size: 150px;
  z-index: 2;
}

.thumbnail-logo .thumbnail-logo__icon {
  inline-size: 150px;
  block-size: 150px;
}
</style>
