<template>
  <div>
    <u-button variant="secondary" @click="onClick">
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

<script setup lang="ts">
import { ref } from "vue";

defineOptions({ name: "u-support-button" });
const isDialogueOpen = ref(false);

const open = () => {
  isDialogueOpen.value = true;
};
const close = () => {
  isDialogueOpen.value = false;
};
const onClick = () => {
  open();
};
</script>
