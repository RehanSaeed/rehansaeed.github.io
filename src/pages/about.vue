<template>
  <Layout>
    <div class="about">

      <u-heading level="1">About</u-heading>

      <u-content-box class="about__container" tag="article">
        <g-image class="about__image" alt="Muhammad Rehan Saeed" height="480" width="320" src="~/assets/images/author/Muhammad-Rehan-Saeed/Profile-320x480.jpg" quality="100"/>
        <u-heading level="2" class="about__title">Muhammad Rehan Saeed</u-heading>
        <u-social-links class="about__social-links"/>
        <p class="about__description">Rehan is a professional Software Developer at Microsoft. Although he works for Microsoft his opinions are his own. If it’s written in C# or .NET, Rehan has probably written something using it in anger!</p>
        <p class="about__description">You can see some of the open source projects that I've started and maintained in my <g-link to="/portfolio/">portfolio</g-link>. There are many others I've contributed to which you can see in my <a href="https://github.com/RehanSaeed">GitHub profile</a> and of course there are other commercial projects that I cannot disclose.</p>
        <p class="about__description">You can see a timeline of my open source work and blog posts in my <a href="https://stackoverflow.com/story/muhammad-rehan-saeed">Stack Overflow Developer Story</a> or just view my <a href="https://stackoverflow.com/users/1212017/muhammad-rehan-saeed">Stack Overflow profile</a>.</p>
        <img class="about__stack-overflow-image" height="58" width="208" :src="stackOverflow"/>
        <p class="about__description">Do you have questions or comments about my work? Please feel free to contact me using any of the links above.</p>
      </u-content-box>

      <u-newsletter/>

    </div>
  </Layout>
</template>

<script>
import contentBox from '~/components/shared/content-box.vue';
import heading from '~/components/shared/heading.vue';
import newsletter from '~/components/newsletter.vue';
import socialLinks from '~/components/social-links.vue';

export default {
  components: {
    'u-content-box': contentBox,
    'u-heading': heading,
    'u-newsletter': newsletter,
    'u-social-links': socialLinks,
  },
  computed: {
    title: function() { return 'About'; },
    description: function() { return `About ${this.$static.metadata.author.name}. ${this.$static.metadata.description}.`; },
    image: function() { return this.$static.metadata.url + '/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg'; },
    url: function() { return this.$static.metadata.url + '/about/'; },
    theme: function() { return (window?.__theme || 'light') == 'light' ? 'dark' : 'light'; },
    stackOverflow: function() { return `https://stackoverflow.com/users/flair/1212017.png?theme=${this.theme}`; },
  },
  metaInfo() {
    return {
      title: this.title,
      link: [
        { rel: 'canonical', href: this.url },
      ],
      meta: [
        { name: 'description', content: this.description },
        { name: 'author', content: this.$static.metadata.author.name },
        // Twitter card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: this.$static.metadata.author.twitter },
        { name: 'twitter:creator', content: this.$static.metadata.author.twitter },
        { name: 'twitter:title', content: this.title },
        { name: 'twitter:description', content: this.description },
        { name: 'twitter:image', content: this.image },
        // Open Graph
        { property: 'og:title', content: this.title },
        { property: 'og:url', content: this.url },
        { property: 'og:image', content: this.image },
        { property: 'og:image:height', content: this.image.match(/(\d*)x(\d*)/)[2] },
        { property: 'og:image:width', content: this.image.match(/(\d*)x(\d*)/)[1] },
        { property: 'og:description', content: this.description },
        { property: 'og:locale', content: this.$static.metadata.language.replace('-', '_') },
        { property: 'og:site_name', content: this.$static.metadata.name },
        { property: 'og:type', content: 'profile' },
        { property: 'profile:first_name', content: this.$static.metadata.author.firstName },
        { property: 'profile:last_name', content: this.$static.metadata.author.lastName },
        { property: 'profile:username', content: this.$static.metadata.author.name },
        { property: 'profile:gender', content: this.$static.metadata.author.gender },
        { property: 'fb:app_id', content: this.$static.metadata.facebookAppId },
      ]
    }
  }
}
</script>

<static-query>
query {
  metadata {
    name
    description
    url
    language
    facebookAppId
    author {
      name
      firstName
      lastName
      gender
      twitter
    }
  }
}
</static-query>

<style lang="scss">
.about {
  display: grid;
  grid-gap: var(--global-space-fluid-5);
  justify-items: center;
}

.about__container {
  display: grid;
  justify-items: center;
  text-align: center;

  &:last-child {
    margin-bottom: 0;
  }
}

.about__image {
  border-radius: var(--global-border-radius);
  display: block;
  width: 320px;
}

.about__social-links {
  margin-bottom: var(--global-space-fluid-3);
}

.about__stack-overflow-image {
  border-radius: var(--global-border-radius);
  display: block;
  margin-bottom: var(--global-space-fixed-5);
  height: 58px;
  width: 208px;
}
</style>
