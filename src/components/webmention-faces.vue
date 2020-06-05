<template>
  <div class="webmention-faces">
    <g-link v-for="mention in mentions"
      :key="mention.id"
      :to="mention.data.url"
      class="webmention-faces__face"
      :title="mention.data.author.name">
      <g-image class="webmention-faces__image"
        :alt="mention.data.author.name"
        :src="mention.data.author.photo"
        height="44"
        width="44"/>
    </g-link>
  </div>
</template>

<script>
export default {
  name: 'u-webmention-faces',
  props: {
    mentions: {
      required: true,
      type: Array,
    }
  }
}
</script>

<style lang="scss">
.webmention-faces {
  display: flex;
  flex-wrap: wrap;
  margin-left: 8px;
}

.webmention-faces__face {
  display: inline-block;
  border: 2px solid white;
  border-radius: 50%;
  margin-left: -8px;

  &:hover {
    opacity: 1;
  }
}

.webmention-faces__image {
  display: block;
  border-radius: 50%;
  object-fit: cover;
  height: 44px;
  width: 44px;
}
</style>
