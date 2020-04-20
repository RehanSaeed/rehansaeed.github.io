<template>
  <Component
    :is="tag || `h${level}`"
    :class="`heading heading--${size || level}`"
  >
    <slot/>
  </Component>
</template>

<script>
export default {
  props: {
    level: {
      default: '1',
      type: String,
    },
    size: {
      default: null,
      type: String,
    },
    tag: {
      default: null,
      type: String,
    },
  }
};
</script>

<style>
.heading--1 {
  font-size: var(--global-font-size-6);
}

.heading--2 {
  font-size: var(--global-font-size-5);
}

.heading--3 {
  font-size: var(--global-font-size-4);
}

.heading--4 {
  font-size: var(--global-font-size-3);
}

.heading--5 {
  font-size: var(--global-font-size-2);
}
</style>
