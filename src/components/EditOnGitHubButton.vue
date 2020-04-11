<template>
  <EffectLink button :to="url">
    <GitHubIcon />
    Edit on GitHub
  </EffectLink>
</template>

<script>
import EffectLink from '~/components/EffectLink.vue';
import GitHubIcon from '~/components/icons/GitHubIcon.vue';

export default {
  components: {
    EffectLink,
    GitHubIcon,
  },
  props: {
    post: Object,
  },
  computed: {
    url: function() {
      return `${this.$static.metadata.repository.url}/tree/${this.$static.metadata.repository.branch}/content/posts/` +
        new Date(this.post.date).getFullYear() +
        this.post.path +
        'index.md';
    }
  }
}
</script>

<static-query>
query {
  metadata {
    repository {
      url
      branch
    }
  }
}
</static-query>
