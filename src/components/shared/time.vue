<template>
  <time class="time" :datetime="datetime" :title="datetime">{{
    datetimeDisplay
  }}</time>
</template>

<script>
import { defineComponent, computed } from "@vue/composition-api";
import { getDisplayDateFromString } from "~/framework/date.js";

export default defineComponent({
  name: "u-time",
  props: {
    datetime: {
      type: String,
      required: true,
    },
  },
  setup({ datetime }) {
    const datetimeDisplay = computed(() => getDisplayDateFromString(datetime));
    return { datetimeDisplay };
  },
});
</script>
