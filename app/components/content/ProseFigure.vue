<template>
  <figure class="prose-figure" data-prose-figure><slot /></figure>
</template>

<style>
.prose-figure {
  --prose-embed-margin-block-start: 0;
  --prose-embed-margin-block-end: 0;
  margin-block: var(--global-space-fixed-5);
  margin-inline: 0;
}
</style>
