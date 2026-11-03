<template>
  <u-tooltip v-slot="{ trigger }" :text="label">
    <Component
      v-bind="{ ...$attrs, ...trigger }"
      class="avatar"
      :is="tag"
      :aria-label="label"
      :href="href"
      :to="to">
      <picture v-if="src && !imageFailed">
        <source v-if="avifSource" type="image/avif" :srcset="avifSource" />
        <img
          class="avatar__image"
          :alt="alt"
          :src="src"
          width="60"
          height="60"
          :loading="loading"
          @error="onImageError" />
      </picture>
      <u-icon v-else class="avatar__fallback" name="fa-solid:user" />
    </Component>
  </u-tooltip>
</template>

<script setup lang="ts">
import { computed, ref, watch, type PropType } from "vue";
import { NuxtLink } from "#components";
import { getAvifSource } from "#shared/utils/images";

defineOptions({ name: "u-avatar", inheritAttrs: false });
const props = defineProps({
  /** Accessible text describing the control or link. */ label: {
    required: true,
    type: String,
  },
  /** Alternative text describing the image; empty for decorative images. */ alt: {
    required: true,
    type: String,
  },
  /** Source URL of the image. */ src: {
    required: true,
    type: String,
  },
  /** Image loading strategy. */ loading: {
    required: false,
    type: String as PropType<"eager" | "lazy">,
  },
  /** Internal route used for navigation. */ to: {
    required: false,
    type: String,
  },
  /** URL used for the link. */ href: {
    required: false,
    type: String,
  },
});
const imageFailed = ref(false);
const avifSource = computed(() => getAvifSource(props.src));
const tag = computed(() => (props.to ? NuxtLink : "a"));

watch(
  () => props.src,
  () => {
    imageFailed.value = false;
  },
);
const onImageError = () => {
  imageFailed.value = true;
};
</script>

<style lang="scss">
@use "~/assets/style/abstracts/avatar";

.avatar {
  @include avatar.frame(var(--global-border-width-3), transparent, 100%);

  transition: scale var(--global-duration-3) var(--ease-out-cubic);
  inline-size: 3rem;
  block-size: 3rem;

  margin: calc(var(--global-border-width-3) * -1);

  &:hover,
  &:focus {
    outline: none;
    scale: 1.4;
    z-index: 1;

    &::after {
      border-color: var(--global-accent-color);
    }
  }
}

.avatar > .icon.avatar__fallback {
  inline-size: 100%;
  block-size: 100%;
  padding: var(--global-space-fixed-3);
  background-color: var(--global-background-color);
  color: var(--global-title-color);
}
</style>
