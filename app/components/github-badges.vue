<template>
  <!-- eslint-disable-next-line vuejs-accessibility/no-redundant-roles -- Preserve list semantics in Safari when list-style is none. -->
  <ul class="github-badges" role="list" aria-label="GitHub links">
    <li class="github-badges__item">
      <u-github-badge
        :href="`https://github.com/${user}?tab=followers`"
        :src="`https://img.shields.io/github/followers/${user}?style=social`"
        alt="GitHub follower count"
        tooltip="View my GitHub followers" />
    </li>
    <li class="github-badges__item">
      <u-github-badge
        :href="gitHubUrl"
        :src="watchersImageUrl"
        :alt="watchersAlt"
        tooltip="Watch subscriptions across my public personal repositories, including forks and archives. Counted per repository, not per person. Updated on each site build." />
    </li>
    <li class="github-badges__item">
      <u-github-badge
        :href="`https://github.com/sponsors/${user}`"
        :src="`https://img.shields.io/github/sponsors/${user}?logo=github&style=social`"
        alt="GitHub sponsors"
        tooltip="Sponsor me on GitHub" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import watchers from "#blog-github-watchers";

const { url: gitHubUrl, user } = useAppConfig().site.author.gitHub;
const watchersImageUrl = `https://img.shields.io/badge/Watchers-${watchers.watchers}-blue?logo=github&style=social`;
const watchersAlt = `GitHub watch subscriptions across my ${watchers.repositories} public account-owned repositories: ${watchers.watchers}`;
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
}

.github-badges__item {
  display: flex;
  margin: 0;
}
</style>
