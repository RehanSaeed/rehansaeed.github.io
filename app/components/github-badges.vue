<template>
  <ul class="github-badges" role="list" aria-label="GitHub links">
    <li class="github-badges__item">
      <u-tooltip v-slot="{ trigger }" text="View my GitHub followers">
        <a
          v-bind="trigger"
          class="github-badges__link"
          :href="`https://github.com/${user}?tab=followers`">
          <img
            class="github-badges__image"
            alt="GitHub follower count"
            height="30"
            width="168"
            :src="`https://img.shields.io/github/followers/${user}?style=social`" />
        </a>
      </u-tooltip>
    </li>
    <li class="github-badges__item">
      <u-tooltip
        v-slot="{ trigger }"
        text="Total watch subscriptions across my public, account-owned repositories, including forks and archived repositories but excluding organisation-owned repositories. A person watching several repositories is counted once per repository. Refreshed when this site builds.">
        <a
          v-bind="trigger"
          class="github-badges__link"
          :href="site.author.gitHub.url">
          <img
            class="github-badges__image"
            :alt="`GitHub watch subscriptions across my ${watchers.repositories} public account-owned repositories: ${watchers.watchers}`"
            height="30"
            width="165"
            :src="`https://img.shields.io/badge/Watchers-${watchers.watchers}-blue?logo=github&style=social`" />
        </a>
      </u-tooltip>
    </li>
    <li class="github-badges__item">
      <u-tooltip v-slot="{ trigger }" text="Sponsor me on GitHub">
        <a
          v-bind="trigger"
          class="github-badges__link"
          :href="`https://github.com/sponsors/${user}`">
          <img
            class="github-badges__image"
            alt="GitHub sponsors"
            height="30"
            width="121"
            :src="`https://img.shields.io/github/sponsors/${user}?logo=github&style=social`" />
        </a>
      </u-tooltip>
    </li>
  </ul>
</template>

<script setup lang="ts">
import watchers from "#blog-github-watchers";

const site = useAppConfig().site;
const user = site.author.gitHub.user;
</script>

<style lang="scss">
.github-badges {
  --github-badges-image-height: 30px;

  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--global-space-fixed-4);
  min-inline-size: 0;
  max-inline-size: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.github-badges__item {
  display: flex;
  margin: 0;
}

.github-badges__link {
  display: inline-flex;
  touch-action: manipulation;

  &:focus-visible {
    outline: var(--global-border-width-2) solid var(--global-accent-color);
    outline-offset: var(--global-focus-outline-offset);
  }
}

.github-badges__image {
  block-size: var(--github-badges-image-height);
}
</style>
