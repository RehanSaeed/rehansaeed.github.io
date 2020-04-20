<template>
   <div class="tags">
   		<EffectLink class="tags__link" button v-for="tag in tags" :key="tag.id" :to="tag.path">
   			{{tag.title}}
   		</EffectLink>
    </div>
</template>

<script>
import EffectLink from '~/components/shared/EffectLink.vue'

export default {
  components: {
    EffectLink,
  },
  props: {
    tags: Array,
  }
}
</script>

<style lang="scss">
.tags {
  --gap: .6rem;

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
