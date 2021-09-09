<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    role="img"
    viewBox="0 0 16 16"
    :height="height"
    :width="width"
    fill="currentColor">
    <title>{{ title }}</title>
    <path d="M2 1h12v5h2l-3 3-3-3h2v-3h-8v2h-2z"></path>
    <path d="M14 14h-12v-5h-2l3-3 3 3h-2v3h8v-2h2z"></path>
  </svg>
</template>

<script>
import createIcon from "~/components/shared/icons/icon.js";

export default createIcon("Repost");
</script>
