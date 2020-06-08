<template>
  <div class="webmention-faces">
    <u-avatar
      class="webmention-faces__face"
      v-for="mention in mentions"
      :key="mention.id"
      :href="mention.data.url"
      :label="mention.data.author.name"
      :alt="mention.data.author.name"
      :src="mention.data.author.photo"/>
  </div>
</template>

<script>
import avatar from '~/components/shared/avatar.vue';

export default {
  name: 'u-webmention-faces',
  components: {
    'u-avatar': avatar,
  },
  props: {
    mentions: {
      required: true,
      type: Array,
    }
  }
}
</script>

<style lang="scss">
.webmention-faces {
  display: flex;
  align-content: flex-start;
  flex-wrap: wrap;
  margin-left: 8px;
}

.webmention-faces__face {
  margin-left: -8px;
  opacity: 0.999;
}
</style>
