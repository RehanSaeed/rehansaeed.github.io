<template>
  <div class="arrows">
    <div class="arrows__arrow arrows__arrow-1"></div>
    <div class="arrows__arrow arrows__arrow-2"></div>
    <div class="arrows__arrow arrows__arrow-3"></div>
    <div class="arrows__arrow arrows__arrow-4"></div>
    <div class="arrows__arrow arrows__arrow-5"></div>
    <div class="arrows__arrow arrows__arrow-6"></div>
    <div class="arrows__arrow arrows__arrow-7"></div>
  </div>
</template>

<script>
export default {
  name: "u-arrows",
};
</script>

<style lang="scss">
.arrows {
  --arrow-height: 1.2rem;
}

.arrows__arrow {
  background: var(--arrow-colour);
  height: var(--arrow-height);
  position: relative;
  z-index: var(--arrow-index);
}
.arrows__arrow::after {
  --arrow-file: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' width='1000' height='128'%3E%3Cpath fill='%23fff' d='m0 0 500 64 500-64v64l-500 64L0 64z'/%3E%3C/svg%3E");
  --arrow-mask: var(--arrow-file) 0% 100%/100% 200%;

  display: block;

  position: absolute;
  top: 100%;
  left: 0;

  background: var(--arrow-colour);
  content: "";
  mask: var(--arrow-mask);
  -webkit-mask: var(--arrow-mask);
  width: 100%;
  height: var(--arrow-height);
}

.arrows__arrow-1 {
  background: transparent;
  margin-block-start: calc(var(--arrow-height) * -1);
}
.arrows__arrow-7 {
  margin-block-end: var(--arrow-height);
}

.arrows__arrow-1 {
  --arrow-colour: var(--global-background-color);
  --arrow-index: 8;
}
.arrows__arrow-2 {
  --arrow-colour: var(--global-arrows-color-1);
  --arrow-index: 7;
}
.arrows__arrow-3 {
  --arrow-colour: var(--global-arrows-color-2);
  --arrow-index: 6;
}
.arrows__arrow-4 {
  --arrow-colour: var(--global-arrows-color-3);
  --arrow-index: 5;
}
.arrows__arrow-5 {
  --arrow-colour: var(--global-arrows-color-4);
  --arrow-index: 4;
}
.arrows__arrow-6 {
  --arrow-colour: var(--global-arrows-color-5);
  --arrow-index: 3;
}
.arrows__arrow-7 {
  --arrow-colour: var(--global-arrows-color-6);
  --arrow-index: 2;
}
</style>
