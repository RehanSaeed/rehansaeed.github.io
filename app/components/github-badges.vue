<template>
  <ul class="github-badges" role="list" aria-label="GitHub links">
    <li>
      <u-tooltip v-slot="{ trigger }" text="View my GitHub followers">
        <a v-bind="trigger" :href="`https://github.com/${user}?tab=followers`">
          <img
            alt="GitHub follower count"
            height="30"
            width="168"
            :src="`https://img.shields.io/github/followers/${user}?style=social`" />
        </a>
      </u-tooltip>
    </li>
    <li>
      <u-tooltip
        v-slot="{ trigger }"
        text="Total watch subscriptions across my public, account-owned repositories, including forks and archived repositories but excluding organisation-owned repositories. A person watching several repositories is counted once per repository. Refreshed when this site builds.">
        <a v-bind="trigger" :href="site.author.gitHub.url">
          <img
            :alt="`GitHub watch subscriptions across my ${watchers.repositories} public account-owned repositories: ${watchers.watchers}`"
            height="30"
            width="165"
            :src="`https://img.shields.io/badge/Watchers-${watchers.watchers}-blue?logo=github&style=social`" />
        </a>
      </u-tooltip>
    </li>
    <li>
      <u-tooltip v-slot="{ trigger }" text="Sponsor me on GitHub">
        <a v-bind="trigger" :href="`https://github.com/sponsors/${user}`">
          <img
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
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--global-space-fixed-4);
  min-inline-size: 0;
  max-inline-size: 100%;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    margin: 0;
  }

  a {
    display: inline-flex;
    touch-action: manipulation;

    &:focus-visible {
      outline: 2px solid var(--global-accent-color);
      outline-offset: 3px;
    }
  }

  img {
    block-size: 30px;
  }
}
</style>
