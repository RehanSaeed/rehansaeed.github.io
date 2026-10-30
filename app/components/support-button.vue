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

<script lang="ts">
export default defineComponent({
  name: "u-support-button",
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
});
</script>
