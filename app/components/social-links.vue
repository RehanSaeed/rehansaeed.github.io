<template>
  <div class="social">
    <u-tooltip
      v-if="metadata.author.youtube.url"
      v-slot="{ trigger }"
      text="YouTube">
      <u-link-button
        v-bind="trigger"
        class="social__link"
        label="Youtube"
        :href="metadata.author.youtube.url"
        rel="me">
        <u-icon name="fa-brands:youtube" />
      </u-link-button>
    </u-tooltip>
    <u-tooltip
      v-if="metadata.author.twitch.url"
      v-slot="{ trigger }"
      text="Twitch">
      <u-link-button
        v-bind="trigger"
        class="social__link"
        label="Twitch"
        :href="metadata.author.twitch.url"
        rel="me">
        <u-icon name="fa-brands:twitch" />
      </u-link-button>
    </u-tooltip>
    <u-tooltip
      v-if="metadata.author.gitHub.url"
      v-slot="{ trigger }"
      text="GitHub">
      <u-link-button
        v-bind="trigger"
        class="social__link"
        label="GitHub"
        :href="metadata.author.gitHub.url"
        rel="me authn">
        <u-icon name="fa-brands:github" />
      </u-link-button>
    </u-tooltip>
    <u-tooltip
      v-if="metadata.author.linkedIn.url"
      v-slot="{ trigger }"
      text="LinkedIn">
      <u-link-button
        v-bind="trigger"
        class="social__link"
        label="LinkedIn"
        :href="metadata.author.linkedIn.url"
        rel="me">
        <u-icon name="fa-brands:linkedin" />
      </u-link-button>
    </u-tooltip>
    <u-tooltip
      v-if="metadata.author.stackOverflow.url"
      v-slot="{ trigger }"
      text="Stack Overflow">
      <u-link-button
        v-bind="trigger"
        class="social__link"
        label="Stack Overflow"
        :href="metadata.author.stackOverflow.url"
        rel="me">
        <u-icon name="fa-brands:stack-overflow" />
      </u-link-button>
    </u-tooltip>
    <u-tooltip
      v-if="metadata.author.bluesky.url"
      v-slot="{ trigger }"
      text="Bluesky">
      <u-link-button
        v-bind="trigger"
        class="social__link"
        label="Bluesky"
        :href="metadata.author.bluesky.url"
        rel="me">
        <u-icon name="simple-icons:bluesky" />
      </u-link-button>
    </u-tooltip>
    <u-tooltip
      v-if="metadata.author.mastodon.url"
      v-slot="{ trigger }"
      text="Mastodon">
      <u-link-button
        v-bind="trigger"
        class="social__link"
        label="Mastodon"
        :href="metadata.author.mastodon.url"
        rel="me">
        <u-icon name="fa-brands:mastodon" />
      </u-link-button>
    </u-tooltip>
    <u-tooltip v-slot="{ trigger }" text="Send me an email">
      <u-link-button
        v-bind="trigger"
        class="social__link"
        label="Email"
        href="#"
        @click="openEmail">
        <u-icon name="fa-regular:envelope" />
      </u-link-button>
    </u-tooltip>
    <u-tooltip v-slot="{ trigger }" text="Subscribe via RSS">
      <u-link-button
        v-bind="trigger"
        class="social__link"
        href="/rss.xml"
        label="RSS">
        <u-icon name="fa-solid:rss" />
      </u-link-button>
    </u-tooltip>
  </div>
</template>

<script>
import { decode } from "~/framework/obfuscate.js";

export default {
  name: "u-social-links",
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

.social .social__link {
  transition-timing-function: ease;

  &:hover {
    transform: scale(1.5);
  }
}
</style>
