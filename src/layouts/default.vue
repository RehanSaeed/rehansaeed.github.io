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
  padding-left: var(--global-space-main);
  padding-right: var(--global-space-main);

  @media screen and (max-width: 576px) { // $global-breakpoint-sm
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
