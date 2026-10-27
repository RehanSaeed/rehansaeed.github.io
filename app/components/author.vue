<template>
  <!-- Added webmention markup (See https://indiewebify.me/validate-h-card/?url=https%3A%2F%2Frehansaeed.com) -->
  <section class="author h-card" :aria-label="metadata.name">
    <div class="author__portrait">
      <NuxtPicture
        format="avif"
        :img-attrs="{ class: 'author__image u-photo' }"
        legacy-format="png"
        :alt="metadata.name"
        loading="eager"
        src="/images/author/Muhammad-Rehan-Saeed/Logo-192x192.png"
        width="120"
        sizes="120px"
        height="120" />
      <svg
        class="author__wink"
        viewBox="0 0 192 192"
        aria-hidden="true"
        focusable="false">
        <defs>
          <radialGradient :id="winkGradientId">
            <stop offset="0" stop-color="#d49a7b" />
            <stop offset="0.7" stop-color="#c88e71" />
            <stop offset="1" stop-color="#b77e64" />
          </radialGradient>
        </defs>
        <g class="author__eyelid">
          <path
            d="M98 90 Q99 85 106 85 Q113 84 115 89 Q114 95 106 95 Q100 95 98 90Z"
            :fill="`url(#${winkGradientId})`" />
          <path
            d="M99 90 Q106 94 113.5 89.5"
            fill="none"
            stroke="#644333"
            stroke-width="0.8"
            stroke-linecap="round" />
        </g>
      </svg>
    </div>

    <u-heading
      :id="headingId || metadata.name"
      class="author__site-title"
      link-class="u-url u-uid p-name"
      level="1"
      :href="metadata.url"
      center
      >{{ metadata.name }}</u-heading
    >

    <p class="author__description p-note">{{ metadata.description }}</p>

    <u-social-links />
  </section>
</template>

<script>
export default {
  name: "u-author",
  props: {
    headingId: {
      type: String,
    },
  },
  setup() {
    return {
      metadata: useAppConfig().site,
      winkGradientId: `${useId()}-wink-skin`,
    };
  },
};
</script>

<style lang="scss">
.author {
  display: grid;
  justify-items: center;
  padding-inline: var(--global-space-fluid-3);
}

.author__portrait {
  position: relative;
  border: var(--global-border-width-2) solid var(--global-title-color);
  border-radius: 100%;
  inline-size: 7rem;
  block-size: 7rem;
  margin-block-end: var(--global-space-fluid-3);
  transition: border-color var(--global-duration-3) ease-out;
}

.author__image {
  border-radius: 100%;
  inline-size: 100%;
  block-size: 100%;
}

.author__wink {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  pointer-events: none;
}

.author__eyelid {
  transform-box: fill-box;
  transform-origin: center top;
  transform: scaleY(0);

  @media (prefers-reduced-motion: no-preference) {
    // A 360ms wink starts after one minute, then repeats every 60 seconds.
    animation: author-wink 60s linear 60s infinite;
  }
}

@keyframes author-wink {
  0%,
  0.6%,
  100% {
    transform: scaleY(0);
  }

  0.2%,
  0.35% {
    transform: scaleY(1);
  }
}

.author__site-title {
  font-size: var(--global-font-size-8);
}

.author__description {
  opacity: 0.8;
  text-align: center;
}

@media print {
  .author {
    display: none;
  }
}
</style>
