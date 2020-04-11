<template>
  <div class="social">
    <EffectLink v-if="this.$static.metadata.author.twitterUrl" :to="this.$static.metadata.author.twitterUrl" class="social__link">
      <TwitterIcon :size="30"/>
    </EffectLink>
    <EffectLink v-if="this.$static.metadata.author.gitHubUrl" :to="this.$static.metadata.author.gitHubUrl" class="social__link">
      <GitHubIcon :size="30"/>
    </EffectLink>
    <EffectLink v-if="this.$static.metadata.author.stackOverflowUrl" :to="this.$static.metadata.author.stackOverflowUrl" class="social__link">
      <StackOverflowIcon :size="30"/>
    </EffectLink>
    <EffectLink v-if="this.$static.metadata.author.linkedInUrl" :to="this.$static.metadata.author.linkedInUrl" class="social__link">
      <LinkedInIcon :size="30"/>
    </EffectLink>
    <EffectLink v-if="this.$static.metadata.author.youtubeUrl" :to="this.$static.metadata.author.youtubeUrl" class="social__link">
      <YoutubeIcon :size="30"/>
    </EffectLink>
    <EffectLink @click.native="OnEmailClick" class="social__link">
      <EmailIcon :size="30"/>
    </EffectLink>
    <EffectLink to="/rss.xml" class="social__link">
      <RssIcon :size="30"/>
    </EffectLink>
  </div>
</template>

<script>
import EffectLink from '~/components/EffectLink.vue';
import EmailIcon from '~/components/icons/EmailIcon.vue';
import GitHubIcon from '~/components/icons/GitHubIcon.vue';
import LinkedInIcon from '~/components/icons/LinkedInIcon.vue';
import RssIcon from '~/components/icons/RssIcon.vue';
import StackOverflowIcon from '~/components/icons/StackOverflowIcon.vue';
import TwitterIcon from '~/components/icons/TwitterIcon.vue';
import YoutubeIcon from '~/components/icons/YoutubeIcon.vue';

export default {
  components: {
    EffectLink,
    EmailIcon,
    GitHubIcon,
    LinkedInIcon,
    RssIcon,
    StackOverflowIcon,
    TwitterIcon,
    YoutubeIcon,
  },
  methods: {
    OnEmailClick: function() {
      const body = encodeURIComponent('If you have an issue with one of my GitHub projects, please raise a GitHub issue. If you need help answering a coding problem, post your question on StackOverflow where you will get quicker and better answers. Otherwise, please do feel free to contact me!')
      window.location.href = `mailto:${this.$static.metadata.author.email.join('')}?body=${body}`;
    }
  }
}
</script>

<static-query>
query {
  metadata {
    author {
      email
      gitHubUrl
      linkedInUrl
      stackOverflowUrl
      twitterUrl
      youtubeUrl
    }
  }
}
</static-query>

<style lang="scss">
.social {
  align-items: center;
  display: grid;
  grid-template-columns: repeat(7, auto);
  grid-gap: 1.8rem;
  justify-content: center;
}
</style>
