<template>
  <div>
    <p class="post-meta">
      Posted
      <u-time
        class="dt-published"
        :class="{ 'post-meta__publication': trafficToggle }"
        :datetime="meta.date">
        <template v-if="trafficToggle" #default="{ trigger, text, ready }">
          {{ text }}
          <span
            v-if="ready"
            v-bind="trigger"
            class="post-meta__date-gesture"
            aria-hidden="true"
            @click="activateTraffic" />
        </template>
      </u-time>
      <template v-if="meta.dateModified">
        and updated
        <u-time class="dt-updated" :datetime="meta.dateModified" />
      </template>
      -
      <strong>{{ meta.timeToRead }} min read</strong>
    </p>
  </div>
</template>

<script>
export default {
  name: "u-post-meta",
  props: {
    meta: {
      type: Object,
      required: true,
    },
    trafficToggle: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["toggle-traffic"],
  setup(_props, { emit }) {
    let activations = 0;
    let lastActivation = 0;
    return {
      activateTraffic() {
        const now = Date.now();
        activations = now - lastActivation > 3000 ? 1 : activations + 1;
        lastActivation = now;
        if (activations === 5) {
          activations = 0;
          emit("toggle-traffic");
        }
      },
    };
  },
};
</script>

<style lang="scss">
.post-meta {
  font-size: var(--global-font-size-1);
  margin-block-end: 0;
  opacity: 0.8;
}
.post-meta__publication {
  position: relative;
}
.post-meta__date-gesture {
  position: absolute;
  inset: 0;
  cursor: text;
  touch-action: manipulation;
}
</style>
