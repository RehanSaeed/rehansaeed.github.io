<template>
  <div class="social">
    <u-link-button
      v-if="metadata.author.youtube.url"
      class="social__link"
      label="Youtube"
      :href="metadata.author.youtube.url"
      rel="me">
      <u-icon name="fa-brands:youtube" />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.twitch.url"
      class="social__link"
      label="Twitch"
      :href="metadata.author.twitch.url"
      rel="me">
      <u-icon name="fa-brands:twitch" />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.mastodon.url"
      class="social__link"
      label="Mastodon"
      :href="metadata.author.mastodon.url"
      rel="me">
      <u-icon name="fa-brands:mastodon" />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.gitHub.url"
      class="social__link"
      label="GitHub"
      :href="metadata.author.gitHub.url"
      rel="me authn">
      <u-icon name="fa-brands:github" />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.linkedIn.url"
      class="social__link"
      label="LinkedIn"
      :href="metadata.author.linkedIn.url"
      rel="me">
      <u-icon name="fa-brands:linkedin" />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.stackOverflow.url"
      class="social__link"
      label="Stack Overflow"
      :href="metadata.author.stackOverflow.url"
      rel="me">
      <u-icon name="fa-brands:stack-overflow" />
    </u-link-button>
    <u-link-button
      class="social__link"
      label="Email"
      href="#"
      @click="openEmail">
      <u-icon name="fa-regular:envelope" />
    </u-link-button>
    <u-link-button class="social__link" href="/rss.xml" label="RSS">
      <u-icon name="fa-solid:rss" />
    </u-link-button>
  </div>
</template>

<script>
import icon from "~/components/shared/icon.vue";
import linkButton from "~/components/shared/link-button.vue";
import { decode } from "~/framework/obfuscate.js";

export default {
  name: "u-social-links",
  components: {
    "u-icon": icon,
    "u-link-button": linkButton,
  },
  setup() {
    return { metadata: useAppConfig().site };
  },
  methods: {
    openEmail(event) {
      const body = encodeURIComponent(
        "If you have an issue with one of my GitHub projects, please raise a GitHub issue. If you need help answering a coding problem, post your question on StackOverflow where you will get quicker and better answers. Otherwise, please do feel free to contact me!",
      );
      event.currentTarget.href = `mailto:${decode(this.metadata.author.email)}?body=${body}`;
    },
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
