<template>
  <u-icon>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
      <title>Close</title>
      <line x1="4" y1="4" x2="20" y2="20"></line>
      <line x1="4" y1="20" x2="20" y2="4"></line>
    </svg>
  </u-icon>
</template>

<script>
import createIcon from "~/components/shared/icons/icon.js";

export default createIcon("u-icon-close");
</script>
