<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="height" :height="width" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <title>{{title}}</title>
    <line x1="4" y1="4" x2="20" y2="20"></line>
    <line x1="4" y1="20" x2="20" y2="4"></line>
  </svg>
</template>

<script>
import createIcon from '~/components/icons/Icon.js';

export default createIcon('Close');
</script>

