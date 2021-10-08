<template>
  <div
    v-if="!noLogo"
    class="thumbnail-logo"
    :style="{ alignSelf: logoAlign, justifySelf: logoJustify }">
    <u-icon-rehan class="thumbnail-logo__icon" />
  </div>
</template>

<script>
import iconRehan from "~/components/shared/icons/icon-rehan.vue";

export default {
  components: {
    "u-icon-rehan": iconRehan,
  },
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

    this.noLogo = noLogo;
    this.logoJustify = logoJustify || "end";
    this.logoAlign = logoAlign || "start";
  },
};
</script>

<style lang="scss">
.thumbnail-logo {
  background: var(--global-background-color);
  border-radius: 50%;
  color: var(--global-accent-color);
  overflow: hidden;
  width: 150px;
  height: 150px;
  z-index: 2;
}

.thumbnail-logo__icon {
  width: 150px;
  height: 150px;
}
</style>
