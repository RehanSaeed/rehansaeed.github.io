<template>
  <Component
    class="heading"
    :is="headingTag"
    :class="[sizeClass, { 'heading--center': center }]">
    <Component :is="linkTag"
      class="heading__link"
      :href="href"
      :to="to">
      <slot/>
    </Component>
  </Component>
</template>

<script>
export default {
  props: {
    level: {
      default: '1',
      required: true,
      type: String,
    },
    size: {
      default: null,
      type: String,
    },
    href: {
      type: String,
    },
    to: {
      type: String,
    },
    center: {
      default: false,
      type: Boolean,
    },
  },
  computed: {
    headingTag() { return `h${this.level}`; },
    sizeClass() { return `heading--${this.size || this.level}`; },
    linkTag() {
      if (this.to || this.href) {
        return this.to ? 'g-link' : 'a';
      } else {
        return 'span';
      }
    }
  }
};
</script>

<style lang="scss">
.heading__link {
  color: var(--global-title-color);
  opacity: 1;
  text-decoration: none;

  &:hover,
  &:focus,
  &:active {
    color: var(--global-title-color);
    opacity: .7;
  }

  &:visited {
    color: var(--global-title-color);
  }
}

.heading--1 {
  font-size: var(--global-font-size-7);
  margin-top: 0;
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

.heading--center {
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}
</style>
