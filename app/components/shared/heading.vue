<template>
  <Component
    class="heading"
    :is="headingTag"
    :id="idInternal"
    :class="[sizeClass, { 'heading--center': center }]">
    <Component
      v-if="hasLink"
      :is="linkTag"
      class="heading__link"
      :class="linkClass"
      :href="href"
      :rel="rel"
      :to="to">
      <slot />
    </Component>
    <slot v-else />
  </Component>
</template>

<script>
import { NuxtLink } from "#components";
import { headingId } from "#shared/utils/headings";

export default {
  name: "u-heading",
  props: {
    /** Identifier used for the heading and its fragment link. */
    id: {
      required: true,
      type: String,
    },
    /** Semantic heading level. */
    level: {
      default: "1",
      type: String,
    },
    /** Visual heading size, independent of its semantic level. */
    size: {
      default: null,
      type: String,
    },
    /** URL used for the link. */
    href: {
      type: String,
    },
    /** Relationship attributes applied to the link. */
    rel: {
      type: String,
    },
    /** Internal route used for navigation. */
    to: {
      type: String,
    },
    /** Whether to centre the heading. */
    center: {
      default: false,
      type: Boolean,
    },
    /** Additional CSS classes applied to the heading link. */
    linkClass: {
      type: String,
    },
  },
  computed: {
    idInternal() {
      return headingId(this.id);
    },
    hasLink() {
      return this.to || this.href;
    },
    headingTag() {
      return `h${this.level}`;
    },
    sizeClass() {
      return `heading--${this.size || this.level}`;
    },
    linkTag() {
      if (this.hasLink) {
        return this.to ? NuxtLink : "a";
      } else {
        return "span";
      }
    },
  },
};
</script>

<style lang="scss">
.heading__link {
  animation: none;
  color: var(--global-title-color);
  opacity: 1;
  text-decoration: none;

  &:hover,
  &:focus,
  &:active {
    color: var(--global-title-color);
    opacity: 0.7;
  }

  &:visited {
    color: var(--global-title-color);
  }
}

.heading--1 {
  font-size: var(--global-font-size-7);
  margin-block-start: 0;
}

.heading--2 {
  font-size: var(--global-font-size-6);
}

.heading--3 {
  font-size: var(--global-font-size-5);
}

.heading--4 {
  font-size: var(--global-font-size-4);
}

.heading--5 {
  font-size: var(--global-font-size-3);
}

.heading--6 {
  font-size: var(--global-font-size-2);
}

.heading--7 {
  font-size: var(--global-font-size-1);
}

.heading--center {
  margin-inline: auto;
  text-align: center;
}
</style>
