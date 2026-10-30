<template>
  <div
    v-if="!noLogo"
    class="thumbnail-logo"
    :style="{ alignSelf: logoAlign, justifySelf: logoJustify }">
    <u-icon name="blog:rehan" class="thumbnail-logo__icon" />
  </div>
</template>

<script lang="ts">
import { queryString } from "~/utils/query";

export default defineComponent({
  data() {
    return {
      noLogo: false,
      logoJustify: "",
      logoAlign: "",
    };
  },
  mounted() {
    const {
      "no-logo": noLogo,
      "logo-justify": logoJustify,
      "logo-align": logoAlign,
    } = this.$route.query;

    this.noLogo = Boolean(noLogo);
    this.logoJustify = queryString(logoJustify) || "end";
    this.logoAlign = queryString(logoAlign) || "start";
  },
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
