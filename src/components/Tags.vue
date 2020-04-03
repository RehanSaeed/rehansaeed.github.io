<template>
   <div class="tags">
   		<EffectLink class="tags__link" v-for="tag in tags" :key="tag.id" :to="tag.path">
   			{{tag.title}}
   		</EffectLink>
    </div>
</template>

<script>
import EffectLink from '~/components/EffectLink.vue'

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
  --tag-gap: .6rem;

  display: flex;
  flex-wrap: wrap;
  margin-right: calc(-1 * var(--tag-gap));
  margin-bottom: calc(-1 * var(--tag-gap));
}

.tags__link {
  background-color: var(--bg-color);
  border-radius: var(--radius);
  font-size: .8em;
  margin-right: var(--tag-gap);
  margin-bottom: var(--tag-gap);
  padding: .5em 1em;
}
</style>
