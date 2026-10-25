<template>
  <u-card
    v-if="previousPost || nextPost"
    class="post-navigation"
    tag="nav"
    aria-label="Post navigation">
    <NuxtLink
      v-if="previousPost"
      class="post-navigation__previous"
      :to="previousPost.permalink"
      rel="prev">
      <strong>Previous post</strong>
      <span>{{ previousPost.title }}</span>
    </NuxtLink>
    <NuxtLink
      v-if="nextPost"
      class="post-navigation__next"
      :to="nextPost.permalink"
      rel="next">
      <strong>Next post</strong>
      <span>{{ nextPost.title }}</span>
    </NuxtLink>
  </u-card>
</template>

<script setup lang="ts">
interface PostLink {
  title: string;
  permalink: string;
}

withDefaults(
  defineProps<{
    previousPost?: PostLink | null;
    nextPost?: PostLink | null;
  }>(),
  { previousPost: null, nextPost: null },
);
</script>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

.post-navigation {
  display: grid;
  gap: var(--global-space-fluid-4);

  a {
    display: grid;
    gap: var(--global-space-fixed-2);
    min-inline-size: 0;
  }

  @include breakpoints.respond-above(sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.post-navigation__next {
  text-align: end;

  @include breakpoints.respond-above(sm) {
    grid-column: 2;
  }
}
</style>
