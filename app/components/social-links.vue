<template>
  <div class="social">
    <u-link-button
      v-if="metadata.author.youtube.url"
      class="social__link"
      label="Youtube"
      :href="metadata.author.youtube.url"
      rel="me">
      <NuxtIcon name="fa-brands:youtube" aria-hidden="true" />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.twitch.url"
      class="social__link"
      label="Twitch"
      :href="metadata.author.twitch.url"
      rel="me">
      <NuxtIcon name="fa-brands:twitch" aria-hidden="true" />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.gitHub.url"
      class="social__link"
      label="GitHub"
      :href="metadata.author.gitHub.url"
      rel="me authn">
      <NuxtIcon name="fa-brands:github" aria-hidden="true" />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.linkedIn.url"
      class="social__link"
      label="LinkedIn"
      :href="metadata.author.linkedIn.url"
      rel="me">
      <NuxtIcon name="fa-brands:linkedin" aria-hidden="true" />
    </u-link-button>
    <u-link-button
      v-if="metadata.author.stackOverflow.url"
      class="social__link"
      label="Stack Overflow"
      :href="metadata.author.stackOverflow.url"
      rel="me">
      <NuxtIcon name="fa-brands:stack-overflow" aria-hidden="true" />
    </u-link-button>
    <u-link-button class="social__link" label="Email" :href="mailTo">
      <NuxtIcon name="fa-regular:envelope" aria-hidden="true" />
    </u-link-button>
    <u-link-button class="social__link" href="/rss.xml" label="RSS">
      <NuxtIcon name="fa-solid:rss" aria-hidden="true" />
    </u-link-button>
  </div>
</template>

<script>
import { NuxtIcon } from "#components";
import linkButton from "~/components/shared/link-button.vue";
import { decode } from "~/framework/obfuscate.js";

export default {
  name: "u-social-links",
  components: {
    NuxtIcon,
    "u-link-button": linkButton,
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
      if (!import.meta.client || !this.email) {
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
