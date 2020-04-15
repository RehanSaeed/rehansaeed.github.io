<template>
  <h1 class="page-title"><slot/></h1>
</template>

<style lang="scss">
.page-title {
  margin-top: calc(var(--global-space) / 2);
  margin-bottom: calc(var(--global-space) / 2);
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}
</style>
