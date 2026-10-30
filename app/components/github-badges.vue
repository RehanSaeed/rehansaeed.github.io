<template>
  <div class="github-badges">
    <u-tooltip v-slot="{ trigger }" text="View my GitHub followers">
      <a v-bind="trigger" :href="`https://github.com/${user}?tab=followers`">
        <img
          alt="GitHub follower count"
          height="30"
          width="168"
          :src="`https://img.shields.io/github/followers/${user}?style=social`" />
      </a>
    </u-tooltip>
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
    <u-tooltip v-slot="{ trigger }" text="Sponsor me on GitHub">
      <a v-bind="trigger" :href="`https://github.com/sponsors/${user}`">
        <img
          alt="GitHub sponsors"
          height="30"
          width="121"
          :src="`https://img.shields.io/github/sponsors/${user}?logo=github&style=social`" />
      </a>
    </u-tooltip>
  </div>
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

  img {
    block-size: 30px;
  }
}
</style>
