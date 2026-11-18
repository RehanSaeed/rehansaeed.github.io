<template>
  <p class="prose-paragraph"><slot /></p>
</template>

<style lang="scss">
.post__content > .prose-paragraph:first-of-type {
  color: var(--global-title-color);
  font-size: var(--global-font-size-4);
  min-inline-size: 0;

  &::first-letter {
    color: var(--global-accent-color);
    font-family: var(--global-font-family-serif);
    float: left;
    float: inline-start;
    font-size: calc(var(--global-font-size-4) * 2.6);
    line-height: calc(var(--global-line-height-1) * 0.44);
    margin-inline-end: var(--global-space-fixed-3);
    margin-block-start: 0.65rem;

    @supports (initial-letter: 2) {
      initial-letter: 2;
      float: none;
      font-size: inherit;
      line-height: normal;
      margin-block-start: 0;
    }
  }
}

.prose-figure > .prose-paragraph {
  max-inline-size: none;
  min-inline-size: 0;
  margin-block-end: 0;
}
</style>
