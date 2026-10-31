<template>
  <div class="webmention-faces">
    <div class="webmention-faces__content"><slot></slot></div>
    <u-avatar
      class="webmention-faces__face"
      v-for="{ mention, name, photo, label } of mentionsDisplay"
      :key="mention.id"
      :href="mention.data.url"
      rel="ugc nofollow"
      :label="label"
      :alt="name"
      :src="photo" />
  </div>
</template>

<script>
import { getDisplayDateFromString } from "~/framework/date.js";

export default {
  name: "u-webmention-faces",
  props: {
    /** Web mentions whose authors are displayed. */
    mentions: {
      required: true,
      type: Array,
    },
  },
  methods: {
    getLabel(mention, name) {
      if (mention.data.published) {
        return `${name} - ${getDisplayDateFromString(mention.data.published)}`;
      }
      return name;
    },
  },
  computed: {
    mentionsDisplay() {
      return this.mentions.map((mention) => {
        const name = mention.data.author?.name?.trim() || "Anonymous";
        return {
          mention,
          name,
          photo: mention.data.author?.photo?.trim() || "",
          label: this.getLabel(mention, name),
        };
      });
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

  padding-inline-start: var(--overlap);
}

.webmention-faces__content {
  margin-inline-start: calc(var(--overlap) * -1);
  margin-inline-end: var(--global-space-fluid-3);
}

.webmention-faces__face:not(:first-of-type) {
  margin-inline-start: calc(var(--overlap) * -1);
}
</style>
