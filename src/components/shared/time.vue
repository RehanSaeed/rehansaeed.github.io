<template>
  <time class="time" :datetime="datetime" :title="datetime">{{
    datetimeDisplay
  }}</time>
</template>

<script>
import { getDisplayDateFromString } from "~/framework/date.js";

export default {
  name: "u-time",
  props: {
    datetime: {
      type: String,
      required: true,
    },
  },
  computed: {
    datetimeDisplay() {
      return getDisplayDateFromString(this.datetime);
    },
  },
};
</script>
