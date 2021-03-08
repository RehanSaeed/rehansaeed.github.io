<template>
  <u-scroll-custom-property>
    <div id="app">
      <u-skip-link />

      <u-scroll-indicator />

      <u-navigation class="navigation" />

      <transition name="fade" appear>
        <main id="main" class="main">
          <slot />
        </main>
      </transition>

      <u-footer class="footer" />

      <portal-target name="body" multiple></portal-target>
    </div>
  </u-scroll-custom-property>
</template>

<script>
import scrollCustomProperty from "~/components/shared/scroll-custom-property.vue";
import scrollIndicator from "~/components/shared/scroll-indicator.vue";
import skipLink from "~/components/shared/skip-link.vue";
import footer from "~/components/footer.vue";
import navigation from "~/components/navigation.vue";

export default {
  components: {
    "u-scroll-custom-property": scrollCustomProperty,
    "u-scroll-indicator": scrollIndicator,
    "u-skip-link": skipLink,
    "u-footer": footer,
    "u-navigation": navigation,
  },
};
</script>

<style lang="scss">
@media screen and (min-width: 75em) {
  // $global-breakpoint-xl
  .navigation {
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

.main {
  margin: 0 auto;
  padding-left: var(--global-space-main);
  padding-right: var(--global-space-main);

  @media screen and (max-width: 36em) {
    // $global-breakpoint-sm
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
