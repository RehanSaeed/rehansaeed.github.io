<template>
  <div class="content-box" :is="tag" :class="{ 'content-box--hoverable': hoverable }">
    <slot/>
  </div>
</template>

<script>
export default {
  name: 'u-content-box',
  props: {
    hoverable: {
      type: Boolean,
    },
    tag: {
      default: 'div',
      type: String,
    }
  }
}
</script>

<style lang="scss">
.content-box {
  background-color: var(--global-content-background-color);
  border-radius: var(--global-border-radius);
  box-shadow: 1px 1px 5px 0 rgba(0,0,0,.02), 1px 1px 15px 0 rgba(0,0,0,.03);
  overflow-wrap: break-word;
	padding: var(--global-space-fluid-6);
  transition: transform var(--global-duration-2) ease-out, background-color var(--global-duration-2) ease-out, box-shadow var(--global-duration-3) ease-out;
}

.content-box--hoverable {
  &:hover {
    transform: translateY(-5px);
    box-shadow: 1px 10px 30px 0 rgba(0,0,0,.1);
  }
}
</style>
