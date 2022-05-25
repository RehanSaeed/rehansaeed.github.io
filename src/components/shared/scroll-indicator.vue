<template>
  <div class="scroll-indicator" />
</template>

<script>
export default {
  name: "u-scroll-indicator",
};
</script>

<style lang="scss">
.scroll-indicator {
  background: linear-gradient(
    to right,
    var(--global-alternate-accent-color) 0%,
    var(--global-alternate-accent-color) 30%,
    var(--global-accent-color) 100%
  );

  inline-size: 0%;
  block-size: 3px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;

  animation: scroll-indicator 1s linear;
  animation-play-state: paused;
  animation-delay: calc(var(--scroll) * -1s);
  animation-iteration-count: 1;
  animation-fill-mode: both;
}

@keyframes scroll-indicator {
  to {
    inline-size: 100%;
  }
}
</style>
