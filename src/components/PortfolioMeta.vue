<template>
   <div class="portfolio-meta">
      Started {{portfolio.date}}
    </div>
</template>

<script>
export default {
  props: {
    portfolio: Object,
  }
}
</script>

<style lang="scss">
.portfolio-meta {
  font-size: .8em;
  opacity: .8;
}
</style>
