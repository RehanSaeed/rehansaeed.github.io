<template>
  <div class="post-meta">
    Posted {{ meta.displayDate }}
    <template v-if="meta.timeToRead">
      - <strong>{{ meta.timeToRead }} min read</strong>
    </template>
  </div>
</template>

<script>
export default {
  name: 'u-post-meta',
  props: {
    meta: {
      type: Object,
    },
  }
}
</script>

<style lang="scss">
.post-meta {
  font-size: var(--global-font-size-1);
  opacity: .8;
}
</style>
