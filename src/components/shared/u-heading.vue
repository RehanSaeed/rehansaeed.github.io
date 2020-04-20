<template>
  <Component
    :is="tag || `h${level}`"
    class="heading"
    :class="[sizeClass, { 'heading--center': center }]">
    <slot/>
  </Component>
</template>

<script>
export default {
  props: {
    level: {
      default: '1',
      required: true,
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
    center: {
      default: false,
      type: Boolean,
    },
  },
  computed: {
    sizeClass() { return `heading--${this.size || this.level}`; }
  }
};
</script>

<style>
.heading--1 {
  font-size: var(--global-font-size-6);
  margin-top: 0;
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

.heading--center {
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}
</style>
