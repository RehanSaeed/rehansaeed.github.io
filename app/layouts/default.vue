<template>
  <u-scroll-custom-property>
    <div id="app">
      <u-skip-link />

      <u-scroll-indicator />

      <u-navigation class="navigation" />

      <transition name="fade" appear>
        <main id="main" class="main" tabindex="-1">
          <slot />
        </main>
      </transition>

      <u-footer class="footer" />
    </div>
  </u-scroll-custom-property>
</template>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

@include breakpoints.respond-above(xl) {
  .navigation {
    position: sticky;
    inset-block-start: 0;
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
