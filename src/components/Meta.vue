<template>
   <div class="meta">
      Posted {{ meta.displayDate }}
      <template v-if="meta.timeToRead">
        - <strong>{{ meta.timeToRead }} min read</strong>
      </template>
    </div>
</template>

<script>
export default {
  props: {
    meta: Object,
  }
}
</script>

<style lang="scss">
.meta {
  font-size: var(--global-font-size-0);
  opacity: .8;
}
</style>
