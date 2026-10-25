<template>
  <div>
    <u-button bordered @click="onClick">
      <u-icon name="simple-icons:buymeacoffee" color="#ffdd00" inline />
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
import icon from "~/components/shared/icon.vue";
import button from "~/components/shared/button.vue";
import dialogue from "~/components/shared/dialogue.vue";
import supportLinks from "~/components/support-links.vue";

export default {
  name: "u-support-button",
  components: {
    "u-icon": icon,
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
