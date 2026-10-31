<template>
  <u-scroll-custom-property>
    <div>
      <u-scroll-indicator />
      <div class="site-shell">
        <div id="app">
          <u-skip-link />

          <u-navigation class="navigation" />

          <transition name="fade" appear>
            <main id="main" class="main" tabindex="-1">
              <slot />
            </main>
          </transition>

          <u-footer class="footer" />
        </div>
      </div>
    </div>
  </u-scroll-custom-property>
</template>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

.site-shell {
  container: site / inline-size;
  // Match media-query em units to the browser's default font, not fluid type.
  font-size: initial;
}

#app {
  font-size: 1rem;
}

@include breakpoints.container-below(site, sm) {
  #app {
    --global-line-length-min: 0;
    --global-space-main: 0;
    --global-space-content-min-width: calc(var(--global-space-fluid-6) * 2);
  }
}

@include breakpoints.container-above(site, xl) {
  .navigation {
    position: sticky;
    inset-block-start: 0;
    z-index: 10;
  }
}

.main {
  margin: 0 auto;
  padding-inline: var(--global-space-main);
}

.footer {
  margin-block-start: var(--global-space-fluid-5);
}
</style>
