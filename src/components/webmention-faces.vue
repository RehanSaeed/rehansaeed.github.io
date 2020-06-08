<template>
  <div class="webmention-faces">
    <u-avatar
      class="webmention-faces__face"
      v-for="{ mention, label } in mentionsDisplay"
      :key="mention.id"
      :href="mention.data.url"
      :label="label"
      :alt="mention.data.author.name"
      :src="mention.data.author.photo"/>
  </div>
</template>

<script>
import avatar from '~/components/shared/avatar.vue';
import { getDisplayDateFromString } from '~/framework/date.js';

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
  },
  methods: {
    getLabel(mention) {
      if (mention.data.published) {
        return `${mention.data.author.name} - ${getDisplayDateFromString(mention.data.published)}`;
      }
      return mention.data.author.name;
    }
  },
  computed: {
    mentionsDisplay() {
      return this.mentions.map(mention => ({
        mention,
        label: this.getLabel(mention),
      }));
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
