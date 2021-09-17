<template>
  <div class="social">
    <u-link-button
      v-if="this.$static.metadata.author.twitter.url"
      label="Twitter"
      :href="this.$static.metadata.author.twitter.url"
      class="social__link"
      rel="me">
      <u-icon-twitter :size="30" />
    </u-link-button>
    <u-link-button
      v-if="this.$static.metadata.author.gitHub.url"
      label="GitHub"
      :href="this.$static.metadata.author.gitHub.url"
      class="social__link"
      rel="me authn">
      <u-icon-github :size="30" />
    </u-link-button>
    <u-link-button
      v-if="this.$static.metadata.author.stackOverflow.url"
      label="Stack Overflow"
      :href="this.$static.metadata.author.stackOverflow.url"
      class="social__link"
      rel="me">
      <u-icon-stackoverflow :size="30" />
    </u-link-button>
    <u-link-button
      v-if="this.$static.metadata.author.linkedIn.url"
      label="LinkedIn"
      :href="this.$static.metadata.author.linkedIn.url"
      class="social__link"
      rel="me">
      <u-icon-linkedin :size="30" />
    </u-link-button>
    <u-link-button
      v-if="this.$static.metadata.author.youtube.url"
      label="Youtube"
      :href="this.$static.metadata.author.youtube.url"
      class="social__link"
      rel="me">
      <u-icon-youtube :size="30" />
    </u-link-button>
    <u-link-button
      v-if="this.$static.metadata.author.twitch.url"
      label="Twitch"
      :href="this.$static.metadata.author.twitch.url"
      class="social__link"
      rel="me">
      <u-icon-twitch :size="30" />
    </u-link-button>
    <u-link-button class="social__link" label="Email" :href="mailTo">
      <u-icon-email :size="30" />
    </u-link-button>
    <u-link-button href="/rss.xml" label="RSS" class="social__link">
      <u-icon-rss :size="30" />
    </u-link-button>
  </div>
</template>

<script>
import linkButton from "~/components/shared/link-button.vue";
import iconEmail from "~/components/shared/icons/icon-email.vue";
import iconGitHub from "~/components/shared/icons/icon-github.vue";
import iconLinkedIn from "~/components/shared/icons/icon-linkedin.vue";
import iconRss from "~/components/shared/icons/icon-rss.vue";
import iconStackOverflow from "~/components/shared/icons/icon-stackoverflow.vue";
import iconTwitch from "~/components/shared/icons/icon-twitch.vue";
import iconTwitter from "~/components/shared/icons/icon-twitter.vue";
import iconYoutube from "~/components/shared/icons/icon-youtube.vue";
import { decode } from "~/framework/obfuscate.js";

export default {
  name: "u-social-links",
  components: {
    "u-link-button": linkButton,
    "u-icon-email": iconEmail,
    "u-icon-github": iconGitHub,
    "u-icon-linkedin": iconLinkedIn,
    "u-icon-rss": iconRss,
    "u-icon-stackoverflow": iconStackOverflow,
    "u-icon-twitch": iconTwitch,
    "u-icon-twitter": iconTwitter,
    "u-icon-youtube": iconYoutube,
  },
  computed: {
    email() {
      return decode(this.$static.metadata.author.email);
    },
    mailTo() {
      const body = encodeURIComponent(
        "If you have an issue with one of my GitHub projects, please raise a GitHub issue. If you need help answering a coding problem, post your question on StackOverflow where you will get quicker and better answers. Otherwise, please do feel free to contact me!"
      );
      return `mailto:${this.email}?body=${body}`;
    },
  },
};
</script>

<static-query>
query {
  metadata {
    author {
      email
      gitHub {
        url
      }
      linkedIn {
        url
      }
      stackOverflow {
        url
      }
      twitch {
        url
      }
      twitter {
        url
      }
      youtube {
        url
      }
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
  line-height: 0;
  margin-right: var(--global-space-fixed-4);
  margin-bottom: var(--global-space-fixed-4);
}
</style>
