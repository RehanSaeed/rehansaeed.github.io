<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="width" :height="height" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <title>{{title}}</title>
    <path d="M20 20l-4-4"/>
    <circle cx="10" cy="10" r="7"/>
  </svg>
</template>

<script>
import createIcon from '~/components/icons/Icon.js';

export default createIcon('Search', 512 / 448);
</script>
