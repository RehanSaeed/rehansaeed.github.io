<template>
  <time class="time" :datetime="datetime" :title="datetime">{{
    datetimeDisplay
  }}</time>
</template>

<script>
import { computed } from "@vue/composition-api";
import { getDisplayDateFromString } from "~/framework/date.js";

export default {
  name: "u-time",
  props: {
    datetime: {
      type: Date,
      required: true,
    },
  },
  setup({ datetime }) {
    const datetimeDisplay = computed(() => getDisplayDateFromString(datetime));
    return { datetimeDisplay };
  },
};
</script>
