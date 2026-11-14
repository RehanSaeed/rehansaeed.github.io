<template>
  <u-tooltip v-slot="{ trigger }" :text="datetime">
    <time
      v-bind="{ ...$attrs, ...trigger }"
      class="time"
      :datetime="datetime"
      tabindex="0"
      >{{ datetimeDisplay }}</time
    >
  </u-tooltip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  getAbsoluteDisplayDateFromString,
  getDisplayDateFromString,
} from "~/framework/date";

defineOptions({ name: "u-time", inheritAttrs: false });
const props = defineProps({
  /** ISO date or timestamp represented by the time element. */ datetime: {
    type: String,
    required: true,
  },
});
const isMounted = useMounted();
// The prerendered absolute date must match hydration before showing relative dates.
const datetimeDisplay = computed(() =>
  isMounted.value
    ? getDisplayDateFromString(props.datetime)
    : getAbsoluteDisplayDateFromString(props.datetime),
);
</script>
