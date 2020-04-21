<template>
   <div class="tags">
   		<u-link class="tags__link" bordered v-for="tag in tags" :key="tag.id" :to="tag.path">
   			{{tag.title}}
   		</u-link>
    </div>
</template>

<script>
import link from '~/components/shared/link.vue'

export default {
  components: {
    'u-link': link,
  },
  props: {
    tags: Array,
  }
}
</script>

<style lang="scss">
.tags {
  --gap: var(--global-space-fluid-2);

  display: flex;
  flex-wrap: wrap;
  margin-right: calc(-1 * var(--gap));
  margin-bottom: calc(-1 * var(--gap));
}

.tags__link {
  margin-right: var(--gap);
  margin-bottom: var(--gap);
}
</style>
