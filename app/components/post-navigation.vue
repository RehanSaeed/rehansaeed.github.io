<template>
  <nav
    v-if="previous || next"
    class="post-navigation"
    aria-label="Post navigation">
    <u-card class="post-navigation__card">
      <NuxtLink
        v-if="previous"
        class="post-navigation__link"
        :to="previous.permalink"
        rel="prev">
        <span class="post-navigation__label">Previous post</span>
        <span>{{ previous.title }}</span>
      </NuxtLink>
      <NuxtLink
        v-if="next"
        class="post-navigation__link post-navigation__link--next"
        :to="next.permalink"
        rel="next">
        <span class="post-navigation__label">Next post</span>
        <span>{{ next.title }}</span>
      </NuxtLink>
    </u-card>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{ permalink: string }>();

const { data: posts } = await useAsyncData("post-navigation", () =>
  queryCollection("posts")
    .where("published", "=", true)
    .order("date", "ASC")
    // Keep navigation stable when multiple posts share a publication date.
    .order("permalink", "ASC")
    .select("title", "permalink")
    .all(),
);

const index = computed(
  () =>
    posts.value?.findIndex((post) => post.permalink === props.permalink) ?? -1,
);
const previous = computed(() =>
  index.value > 0 ? posts.value?.[index.value - 1] : undefined,
);
const next = computed(() =>
  index.value >= 0 ? posts.value?.[index.value + 1] : undefined,
);
</script>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

.post-navigation__card {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--global-space-fluid-5);

  @include breakpoints.respond-below(sm) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.post-navigation__link {
  display: grid;
  align-content: start;
  gap: var(--global-space-fluid-3);
  min-inline-size: 0;
}

.post-navigation__link--next {
  grid-column: -2 / -1;
  text-align: end;
}

.post-navigation__label {
  font-weight: var(--global-font-weight-bold);
}
</style>
