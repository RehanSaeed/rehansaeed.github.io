<template>
   <div class="meta">
      Posted {{ meta.date }}
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
  font-size: .8em;
  opacity: .8;
}
</style>
