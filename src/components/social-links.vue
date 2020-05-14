<template>
  <div class="social">
    <u-link v-if="this.$static.metadata.author.twitterUrl" label="Twitter" :href="this.$static.metadata.author.twitterUrl" class="social__link">
      <u-icon-twitter :size="30"/>
    </u-link>
    <u-link v-if="this.$static.metadata.author.gitHubUrl" label="GitHub" :href="this.$static.metadata.author.gitHubUrl" class="social__link">
      <u-icon-github :size="30"/>
    </u-link>
    <u-link v-if="this.$static.metadata.author.stackOverflowUrl" label="Stack Overflow" :href="this.$static.metadata.author.stackOverflowUrl" class="social__link">
      <u-icon-stackoverflow :size="30"/>
    </u-link>
    <u-link v-if="this.$static.metadata.author.linkedInUrl" label="LinkedIn" :href="this.$static.metadata.author.linkedInUrl" class="social__link">
      <u-icon-linkedin :size="30"/>
    </u-link>
    <u-link v-if="this.$static.metadata.author.youtubeUrl" label="Youtube" :href="this.$static.metadata.author.youtubeUrl" class="social__link">
      <u-icon-youtube :size="30"/>
    </u-link>
    <u-link class="social__link" label="Email" :href="mailTo">
      <u-icon-email :size="30"/>
    </u-link>
    <u-link href="/rss.xml" label="RSS" class="social__link">
      <u-icon-rss :size="30"/>
    </u-link>
  </div>
</template>

<script>
import link from '~/components/shared/link.vue';
import iconEmail from '~/components/shared/icons/icon-email.vue';
import iconGitHub from '~/components/shared/icons/icon-github.vue';
import iconLinkedIn from '~/components/shared/icons/icon-linkedin.vue';
import iconRss from '~/components/shared/icons/icon-rss.vue';
import iconStackOverflow from '~/components/shared/icons/icon-stackoverflow.vue';
import iconTwitter from '~/components/shared/icons/icon-twitter.vue';
import iconYoutube from '~/components/shared/icons/icon-youtube.vue';
import { decode } from '~/framework/obfuscate.js';

export default {
  name: 'u-social-links',
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
  computed: {
    email: function() { return decode(this.$static.metadata.author.email); },
    mailTo: function() {
      const body = encodeURIComponent('If you have an issue with one of my GitHub projects, please raise a GitHub issue. If you need help answering a coding problem, post your question on StackOverflow where you will get quicker and better answers. Otherwise, please do feel free to contact me!')
      return `mailto:${this.email}?body=${body}`;
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
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-right: var(--global-space-fixed--4);
  margin-bottom: var(--global-space-fixed--4);
}

.social__link {
  margin-right: var(--global-space-fixed-4);
  margin-bottom: var(--global-space-fixed-4);
}
</style>
