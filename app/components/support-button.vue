<template>
  <div>
    <u-button bordered @click="onClick">
      <NuxtIcon
        name="simple-icons:buymeacoffee"
        class="icon--inline"
        aria-hidden="true" />
      Buy me a Coffee
    </u-button>

    <u-dialogue
      title="Buy me a Coffee"
      :is-open="isDialogueOpen"
      @close="close">
      <u-support-links />
    </u-dialogue>
  </div>
</template>

<script>
import { NuxtIcon } from "#components";
import button from "~/components/shared/button.vue";
import dialogue from "~/components/shared/dialogue.vue";
import supportLinks from "~/components/support-links.vue";

export default {
  name: "u-support-button",
  components: {
    NuxtIcon,
    "u-button": button,
    "u-dialogue": dialogue,
    "u-support-links": supportLinks,
  },
  data() {
    return {
      isDialogueOpen: false,
    };
  },
  methods: {
    open() {
      this.isDialogueOpen = true;
    },
    close() {
      this.isDialogueOpen = false;
    },
    onClick() {
      this.open();
    },
  },
};
</script>
