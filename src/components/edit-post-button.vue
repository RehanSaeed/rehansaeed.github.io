<template>
  <u-link bordered :to="url">
    <u-icon-github />
    Edit on GitHub
  </u-link>
</template>

<script>
import link from '~/components/shared/link.vue';
import iconGitHub from '~/components/shared/icons/icon-github.vue';

export default {
  name: 'u-edit-post-button',
  components: {
    'u-link': link,
    'u-icon-github': iconGitHub,
  },
  props: {
    post: {
      type: Object,
    },
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
