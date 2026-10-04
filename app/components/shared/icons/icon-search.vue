<template>
  <svg
    :class="svgClass"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    role="img"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round">
    <title>{{ title || "Search" }}</title>
    <path d="M20 20l-4-4" />
    <circle cx="10" cy="10" r="7" />
  </svg>
</template>

<script>
import createIcon from "~/components/shared/icons/icon.js";

export default createIcon("u-icon-search");
</script>
