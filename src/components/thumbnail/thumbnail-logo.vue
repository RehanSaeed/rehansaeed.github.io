<template>
  <div
    v-if="!noLogo"
    class="thumbnail-logo"
    :style="{ alignSelf: logoAlign, justifySelf: logoJustify }"
  >
    <u-icon-rehan width="150" height="150" />
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
  width: 150px;
  height: 150px;
  z-index: 2;
}
</style>
