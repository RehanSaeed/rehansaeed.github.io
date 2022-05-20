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
@use "~/assets/style/abstracts/breakpoints";

@include breakpoints.respond-above(xl) {
  .navigation {
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

.main {
  margin: 0 auto;
  padding-inline: var(--global-space-main);

  @include breakpoints.respond-below(sm) {
    padding-inline: 0;
  }
}

.footer {
  margin-block-start: var(--global-space-fluid-5);
}
</style>
