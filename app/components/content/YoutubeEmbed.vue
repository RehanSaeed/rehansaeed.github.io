<template>
  <div class="youtube-embed">
    <div class="youtube-embed__bleed">
      <div class="youtube-embed__frame">
        <iframe
          class="youtube-embed__video"
          :src="src"
          :title="`YouTube video: ${src.split('/').pop()}`"
          allow="autoplay; encrypted-media"
          allowfullscreen />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** URL of the embedded YouTube video or playlist. */ src: string;
}>();
</script>

<style scoped>
.youtube-embed {
  margin-block-start: var(
    --prose-embed-margin-block-start,
    var(--global-space-fixed-4)
  );
  margin-block-end: var(
    --prose-embed-margin-block-end,
    var(--global-space-fixed-5)
  );
}

.youtube-embed__bleed {
  inline-size: 100%;
  margin-inline: auto;
}

.youtube-embed__frame {
  position: relative;
  margin-inline: var(--global-space-fluid--6);
  padding-block: 34%;
  height: 0;
}

.youtube-embed__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
