<template>
  <div
    class="portfolio-statistics"
    :class="{ 'portfolio-statistics--borderless': borderless }"
    :data-downloads="statistics.downloads"
    :data-stars="statistics.stars">
    <div class="portfolio-statistics__totals">
      <u-number-ticker
        label="Package Downloads"
        :number="statistics.downloads"
        :rate="downloadRate"
        :info="downloadInfo" />
      <u-number-ticker
        label="GitHub Stars"
        :number="statistics.stars"
        :rate="starRate"
        :info="starInfo" />
    </div>
    <u-github-badges />
  </div>
</template>

<script setup lang="ts">
import statistics from "#blog-portfolio-statistics";
import { canProjectCounter } from "#shared/utils/ticker";

defineProps<{ borderless?: boolean }>();

const downloadInfo = `Verified total: ${statistics.downloads.toLocaleString("en-GB")} lifetime package downloads across the published open source projects in my portfolio. Downloads are not unique people. The number animates using package lifetime averages, not a live feed. Counts refresh when the site builds.`;
const starInfo = `Verified total: ${statistics.stars.toLocaleString("en-GB")} GitHub stars across the published open source projects in my portfolio, including listed organisation-owned repositories. The number animates illustratively at an average of one increase every 15 seconds, not live activity. Counts refresh when the site builds.`;

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

.portfolio-statistics--borderless {
  .number-ticker {
    border: 0;
    background: none;
  }
  .number-ticker__label {
    min-block-size: 0;
  }
}
</style>
