<template>
  <time class="time" :datetime="datetime" :title="datetime">{{
    datetimeDisplay
  }}</time>
</template>

<script>
import {
  getAbsoluteDisplayDateFromString,
  getDisplayDateFromString,
} from "~/framework/date.js";

export default {
  name: "u-time",
  props: {
    datetime: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isMounted: false,
    };
  },
  computed: {
    // Recent dates are shown relative to now (e.g. "3 days ago"), which is only known in the
    // browser. The prerendered HTML has the absolute date, which hydration must match.
    datetimeDisplay() {
      return this.isMounted
        ? getDisplayDateFromString(this.datetime)
        : getAbsoluteDisplayDateFromString(this.datetime);
    },
  },
  mounted() {
    this.isMounted = true;
  },
};
</script>
