<template>
  <div>
    <u-button bordered @click.native="onClick">
      <u-icon-coffee /> Buy me a Coffee
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
import button from "~/components/shared/button.vue";
import dialogue from "~/components/shared/dialogue.vue";
import iconCoffee from "~/components/shared/icons/icon-coffee.vue";
import supportLinks from "~/components/support-links.vue";

export default {
  name: "u-support-button",
  components: {
    "u-button": button,
    "u-dialogue": dialogue,
    "u-icon-coffee": iconCoffee,
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
