<template>
  <Layout :show-logo="true">

    <h1 class="about__title">About</h1>

    <ContentBox>
      <g-image class="about__image" alt="Muhammad Rehan Saeed" height="480" width="320" src="~/assets/images/Muhammad-Rehan-Saeed-Profile.jpg" />
      <h2 class="about__title">Muhammad Rehan Saeed</h2>
      <p class="about__description">Rehan is a professional Software Developer at Microsoft. Although he works for Microsoft his opinions are his own. If it’s written in C# or .NET, Rehan has probably written something using it in anger!</p>
      <p class="about__description">You can see a timeline of my open source work and blog posts in my <g-link src="https://stackoverflow.com/story/muhammad-rehan-saeed">Stack Overflow Developer Story</g-link>.</p>
    </ContentBox>

  </Layout>
</template>

<static-query>
query {
  metadata {
    description
    url
    author {
      name
      twitter
    }
  }
}
</static-query>

<script>
import ContentBox from '~/components/ContentBox.vue';

export default {
  components: {
    ContentBox,
  },
  computed: {
    title: function() { return 'About'; },
    description: function() { return `About ${this.$static.metadata.author.name}. ${this.$static.metadata.description}.`; }
  },
  metaInfo() {
    return {
      title: this.title,
      meta: [
        {
          name: 'description',
          content: this.description
        },
        {
          name: 'author',
          content: this.$static.metadata.author.name
        },

        // Twitter card
        {
          name: 'twitter:card',
          content: 'summary_large_image'
        },
        {
          name: 'twitter:site',
          content: this.$static.metadata.author.twitter
        },
        {
          name: 'twitter:creator',
          content: this.$static.metadata.author.twitter
        },
        {
          name: 'twitter:title',
          content: this.title
        },
        {
          name: 'twitter:description',
          content: this.description
        },
        {
          name: 'twitter:image',
          content: this.$static.metadata.url + '/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg'
        }
      ]
    }
  }
}
</script>

<style lang="scss">
.about__title {
  padding: calc(var(--space) / 2) 0 calc(var(--space) / 2);
  text-align: center;
}

.about__image {
  border-radius: var(--radius);
  display: block;
  margin: 0 auto;
}

.about__title {
  text-align: center;
}

.about__description {
  text-align: center;
}
</style>
