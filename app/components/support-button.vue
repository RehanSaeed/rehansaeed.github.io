<template>
  <div>
    <u-button bordered @click="onClick">
      <u-icon name="simple-icons:buymeacoffee" inline />
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
export default {
  name: "u-support-button",
  data() {
    return {
      isDialogueOpen: false,
    };
  },
  setup() {
    return { playSound: useUiSound().play };
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
      this.playSound("dialog-open");
    },
  },
};
</script>
