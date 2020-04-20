<template>
  <div class="social">
    <u-link v-if="this.$static.metadata.author.twitterUrl" label="Twitter" :to="this.$static.metadata.author.twitterUrl" class="social__link">
      <u-icon-twitter :size="30"/>
    </u-link>
    <u-link v-if="this.$static.metadata.author.gitHubUrl" label="GitHub" :to="this.$static.metadata.author.gitHubUrl" class="social__link">
      <u-icon-github :size="30"/>
    </u-link>
    <u-link v-if="this.$static.metadata.author.stackOverflowUrl" label="StackOverflow" :to="this.$static.metadata.author.stackOverflowUrl" class="social__link">
      <u-icon-stackoverflow :size="30"/>
    </u-link>
    <u-link v-if="this.$static.metadata.author.linkedInUrl" label="LinkedIn" :to="this.$static.metadata.author.linkedInUrl" class="social__link">
      <u-icon-linkedin :size="30"/>
    </u-link>
    <u-link v-if="this.$static.metadata.author.youtubeUrl" label="Youtube" :to="this.$static.metadata.author.youtubeUrl" class="social__link">
      <u-icon-youtube :size="30"/>
    </u-link>
    <u-link @click.native="OnEmailClick" label="Email" class="social__link">
      <u-icon-email :size="30"/>
    </u-link>
    <u-link to="/rss.xml" label="RSS" class="social__link">
      <u-icon-rss :size="30"/>
    </u-link>
  </div>
</template>

<script>
import link from '~/components/shared/u-link.vue';
import iconEmail from '~/components/shared/icons/u-icon-email.vue';
import iconGitHub from '~/components/shared/icons/u-icon-github.vue';
import iconLinkedIn from '~/components/shared/icons/u-icon-linkedin.vue';
import iconRss from '~/components/shared/icons/u-icon-rss.vue';
import iconStackOverflow from '~/components/shared/icons/u-icon-stackoverflow.vue';
import iconTwitter from '~/components/shared/icons/u-icon-twitter.vue';
import iconYoutube from '~/components/shared/icons/u-icon-youtube.vue';

export default {
  components: {
    'u-link': link,
    'u-icon-email': iconEmail,
    'u-icon-github': iconGitHub,
    'u-icon-linkedin': iconLinkedIn,
    'u-icon-rss': iconRss,
    'u-icon-stackoverflow': iconStackOverflow,
    'u-icon-twitter': iconTwitter,
    'u-icon-youtube': iconYoutube,
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
