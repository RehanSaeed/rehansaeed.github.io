<template>
  <Component
    class="heading"
    :is="headingTag"
    :id="idInternal"
    :class="[sizeClass, { 'heading--center': center }]"
  >
    <Component
      v-if="hasLink"
      :is="linkTag"
      class="heading__link"
      :class="linkClass"
      :href="href"
      :to="to"
    >
      <slot />
    </Component>
    <slot v-else />
  </Component>
</template>

<script>
export default {
  name: "u-heading",
  props: {
    id: {
      required: true,
      type: String,
    },
    level: {
      default: "1",
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
    linkClass: {
      type: String,
    },
  },
  computed: {
    idInternal() {
      return this.id.split(" ").join("-").toLowerCase();
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
        return this.to ? "g-link" : "a";
      } else {
        return "span";
      }
    },
  },
};
</script>

<style lang="scss">
.heading:target {
  animation-name: target;
  animation-duration: 3s;
  animation-iteration-count: 1;
  animation-direction: linear;

  @keyframes target {
    from {
      background: transparent;
    }
    50% {
      background: var(--global-alternate-accent-color);
    }
    to {
      background: transparent;
    }
  }
}

.heading__link {
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
