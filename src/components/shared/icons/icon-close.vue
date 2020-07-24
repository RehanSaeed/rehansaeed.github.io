<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    role="img"
    viewBox="0 0 24 24"
    :height="height"
    :width="width"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <title>{{ title }}</title>
    <line x1="4" y1="4" x2="20" y2="20"></line>
    <line x1="4" y1="20" x2="20" y2="4"></line>
  </svg>
</template>

<script>
import createIcon from "~/components/shared/icons/icon.js";

export default createIcon("Close");
</script>
