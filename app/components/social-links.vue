<template>
  <div class="social">
    <u-link-button
      v-if="metadata.author.youtube.url"
      class="social__link"
      label="Youtube"
      :href="metadata.author.youtube.url"
      rel="me">
      <u-icon-youtube />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.twitch.url"
      class="social__link"
      label="Twitch"
      :href="metadata.author.twitch.url"
      rel="me">
      <u-icon-twitch />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.gitHub.url"
      class="social__link"
      label="GitHub"
      :href="metadata.author.gitHub.url"
      rel="me authn">
      <u-icon-github />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.linkedIn.url"
      class="social__link"
      label="LinkedIn"
      :href="metadata.author.linkedIn.url"
      rel="me">
      <u-icon-linkedin />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.stackOverflow.url"
      class="social__link"
      label="Stack Overflow"
      :href="metadata.author.stackOverflow.url"
      rel="me">
      <u-icon-stackoverflow />
    </u-link-button>
    <u-link-button class="social__link" label="Email" :href="mailTo">
      <u-icon-email />
    </u-link-button>
    <u-link-button class="social__link" href="/rss.xml" label="RSS">
      <u-icon-rss />
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
    "u-icon-youtube": iconYoutube,
  },
  setup() {
    return { metadata: useAppConfig().site };
  },
  data() {
    return {
      email: undefined,
    };
  },
  computed: {
    mailTo() {
      if (!this.email) {
        return undefined;
      }
      const body = encodeURIComponent(
        "If you have an issue with one of my GitHub projects, please raise a GitHub issue. If you need help answering a coding problem, post your question on StackOverflow where you will get quicker and better answers. Otherwise, please do feel free to contact me!",
      );
      return `mailto:${this.email}?body=${body}`;
    },
  },
  mounted() {
    // Decoded in the browser only, so the address never appears in the static HTML.
    this.email = decode(this.metadata.author.email);
  },
};
</script>

<style lang="scss">
.social {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--global-space-fixed-4);
  justify-content: center;

  font-size: var(--global-font-size-7);
}
</style>
