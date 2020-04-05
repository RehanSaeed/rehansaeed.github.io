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

<script>
import ContentBox from '~/components/ContentBox.vue'

export default {
  components: {
    ContentBox,
  },
  metaInfo() {
    return {
      title: 'About'
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
