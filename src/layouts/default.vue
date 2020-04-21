<template>
  <div id="app">

    <u-navigation class="navigation" />

    <main class="main">
      <slot/>
    </main>

    <u-footer class="footer"/>

  </div>
</template>

<script>
import footer from '~/components/footer.vue';
import navigation from '~/components/navigation.vue';

export default {
  components: {
    'u-footer': footer,
    'u-navigation': navigation,
  }
}
</script>

<style lang="scss">
@media screen and (min-width: 1200px) { // $global-breakpoint-xl
  .navigation {
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

.main {
  margin: 0 auto;
  padding-left: calc(var(--global-space-fluid-6) * 2.7);
  padding-right: calc(var(--global-space-fluid-6) * 2.7);
}
</style>
