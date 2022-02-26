<template>
  <div class="webmention-faces">
    <div class="webmention-faces__content"><slot></slot></div>
    <u-avatar
      class="webmention-faces__face"
      v-for="{ mention, label } of mentionsDisplay"
      :key="mention.id"
      :href="mention.data.url"
      :label="label"
      :alt="mention.data.author.name"
      :src="mention.data.author.photo" />
  </div>
</template>

<script>
import avatar from "~/components/shared/avatar.vue";
import { getDisplayDateFromString } from "~/framework/date.js";

export default {
  name: "u-webmention-faces",
  components: {
    "u-avatar": avatar,
  },
  props: {
    mentions: {
      required: true,
      type: Array,
    },
  },
  methods: {
    getLabel(mention) {
      if (mention.data.published) {
        return `${mention.data.author.name} - ${getDisplayDateFromString(
          mention.data.published
        )}`;
      }
      return mention.data.author.name;
    },
  },
  computed: {
    mentionsDisplay() {
      return this.mentions.map((mention) => ({
        mention,
        label: this.getLabel(mention),
      }));
    },
  },
};
</script>

<style lang="scss">
.webmention-faces {
  --overlap: 0.6rem;

  display: flex;
  align-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  row-gap: var(--global-space-fixed-2);

  padding-left: var(--overlap);
}

.webmention-faces__content {
  margin-left: calc(var(--overlap) * -1);
  margin-right: var(--global-space-fluid-3);
}

.webmention-faces__face:not(:first-of-type) {
  margin-left: calc(var(--overlap) * -1);
}
</style>
