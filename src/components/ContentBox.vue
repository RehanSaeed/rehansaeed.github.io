<template>
  <div class="content-box" :class="{ 'content-box--hoverable': hoverable }">
    <slot></slot>
  </div>
</template>

<script>
export default {
  props: {
    hoverable: Boolean
  }
}
</script>

<style lang="scss">
.content-box {
	background-color: var(--bg-content-color);
	max-width: var(--content-width);
	margin: 0 auto;
	transition: background-color .6s;
	padding: var(--space);
  border-radius: var(--radius);
  box-shadow: 1px 1px 5px 0 rgba(0,0,0,.02), 1px 1px 15px 0 rgba(0,0,0,.03);
  transition: transform .3s, background-color .3s, box-shadow .6s;
}

.content-box--hoverable {
  &:hover {
    transform: translateY(-5px);
    box-shadow: 1px 10px 30px 0 rgba(0,0,0,.1);
  }
}
</style>
