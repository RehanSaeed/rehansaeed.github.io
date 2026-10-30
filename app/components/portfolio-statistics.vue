<template>
  <div
    class="portfolio-statistics"
    :class="{ 'portfolio-statistics--borderless': borderless }"
    :data-downloads="statistics.downloads"
    :data-stars="statistics.stars"
    :data-followers="accountStats ? account.followers : undefined"
    :data-watchers="accountStats ? account.watchers : undefined">
    <div class="portfolio-statistics__totals">
      <u-number-ticker
        title="My Package Downloads"
        :number="statistics.downloads"
        :rate="downloadRate">
        <template #info>
          <u-tooltip v-slot="{ trigger }" :text="downloadInfo">
            <u-button
              v-bind="trigger"
              class="portfolio-statistics__info"
              aria-label="About package downloads">
              <u-icon name="fa-solid:info-circle" />
            </u-button>
          </u-tooltip>
        </template>
      </u-number-ticker>
      <u-number-ticker
        title="My GitHub Stars"
        :number="statistics.stars"
        :rate="starRate">
        <template #info>
          <u-tooltip v-slot="{ trigger }" :text="starInfo">
            <u-button
              v-bind="trigger"
              class="portfolio-statistics__info"
              aria-label="About GitHub stars">
              <u-icon name="fa-solid:info-circle" />
            </u-button>
          </u-tooltip>
        </template>
      </u-number-ticker>
      <u-number-ticker
        v-if="accountStats"
        title="My GitHub Followers"
        :number="account.followers"
        :rate="0">
        <template #info>
          <u-tooltip v-slot="{ trigger }" :text="followerInfo">
            <u-button
              v-bind="trigger"
              class="portfolio-statistics__info"
              aria-label="About GitHub followers">
              <u-icon name="fa-solid:info-circle" />
            </u-button>
          </u-tooltip>
        </template>
      </u-number-ticker>
      <u-number-ticker
        v-if="accountStats"
        title="My GitHub Watchers"
        :number="account.watchers"
        :rate="0">
        <template #info>
          <u-tooltip v-slot="{ trigger }" :text="watcherInfo">
            <u-button
              v-bind="trigger"
              class="portfolio-statistics__info"
              aria-label="About GitHub watchers">
              <u-icon name="fa-solid:info-circle" />
            </u-button>
          </u-tooltip>
        </template>
      </u-number-ticker>
    </div>
  </div>
</template>

<script setup lang="ts">
import statistics from "#blog-portfolio-statistics";
import account from "#blog-github-watchers";
import { canProjectCounter } from "#shared/utils/ticker";

defineProps<{ borderless?: boolean; accountStats?: boolean }>();

const downloadInfo = `Verified total: ${statistics.downloads.toLocaleString("en-GB")} lifetime package downloads across the published open source projects in my portfolio. Downloads are not unique people. The number animates using package lifetime averages, not a live feed. Counts refresh when the site builds.`;
const starInfo = `Verified total: ${statistics.stars.toLocaleString("en-GB")} GitHub stars across the published open source projects in my portfolio, including listed organisation-owned repositories. The number animates illustratively at an average of one increase every 15 seconds, not live activity. Counts refresh when the site builds.`;
const followerInfo = `Verified total: ${account.followers.toLocaleString("en-GB")} people following my GitHub account. This is a build snapshot, not an animated estimate or live feed. The badge below refreshes independently, so its count can differ.`;
const watcherInfo = `Verified total: ${account.watchers.toLocaleString("en-GB")} watch subscriptions across my ${account.repositories} public, account-owned repositories, including forks and archived repositories. Organisation-owned repositories are excluded. A person watching several repositories is counted once per repository. This is a build snapshot, not an animated estimate or live feed.`;

const now = ref(0);
const downloadRate = computed(() =>
  canProjectCounter(statistics.growth.downloads, now.value)
    ? statistics.growth.downloads.perSecond!
    : 0,
);
const starRate = computed(() =>
  canProjectCounter(statistics.growth.stars, now.value)
    ? statistics.growth.stars.perSecond
    : 0,
);
onMounted(() => {
  now.value = Date.now();
});
</script>

<style lang="scss">
.portfolio-statistics {
  display: grid;
  min-inline-size: 0;
  inline-size: 100%;
  justify-items: center;
  gap: var(--global-space-fixed-4);
  text-align: center;
}

.portfolio-statistics__totals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(0.5rem, 2vw, 2rem);
  inline-size: 100%;
  max-inline-size: var(--global-space-card-max-width);
  min-inline-size: 0;
  font-size: max(16px, 0.85em);
}

.portfolio-statistics__info {
  display: grid;
  place-items: center;
  inline-size: 1.25rem;
  block-size: 1.5rem;
  font-size: 1rem;
}

.portfolio-statistics--borderless {
  .number-ticker {
    border: 0;
    background: none;
  }
  .number-ticker__title {
    min-block-size: 0;
  }
}
</style>
