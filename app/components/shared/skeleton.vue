<script>
import Vue from "vue";

export default {
  name: "u-skeleton",
  data() {
    return {
      svg: "",
    };
  },
  props: {
    isBusy: {
      default: true,
      type: Boolean,
    },
    maskRepeat: {
      default: "no-repeat space",
      type: String,
    },
  },
  computed: {
    maskImage() {
      const encodedSvg = btoa(this.svg);
      return `url('data:image/svg+xml;base64,${encodedSvg}')`;
    },
  },
  methods: {
    toSvg(vnodes) {
      const svgRenderer = Vue.extend({
        render: function () {
          return vnodes;
        },
      });
      const instance = new svgRenderer();
      instance.$mount();
      return instance.$el.outerHTML;
    },
  },
  mounted() {
    this.svg = this.toSvg(this.$slots.default);
  },
  beforeUpdate() {
    this.svg = this.toSvg(this.$slots.default);
  },
  render(createElement) {
    const style = process.isClient
      ? `-webkit-mask-image: ${this.maskImage}; mask-image: ${this.maskImage}; -webkit-mask-repeat: ${this.maskRepeat}; mask-repeat: ${this.maskRepeat};`
      : undefined;
    return createElement("div", {
      class: "skeleton",
      attrs: {
        "aria-busy": this.isBusy,
        style,
      },
    });
  },
};
</script>

<style lang="scss">
.skeleton {
  background: var(--global-skeleton-dark-color);
  cursor: progress;
  overflow: hidden;
  position: relative;

  @media (prefers-reduced-motion: no-preference) {
    animation: skeleton-animation 2s infinite linear;
    background: linear-gradient(
        to right,
        var(--global-skeleton-light-color) 0%,
        var(--global-skeleton-dark-color) 30%,
        var(--global-skeleton-dark-color) 70%,
        var(--global-skeleton-light-color) 100%
      )
      0 0 / 200% 100% var(--global-skeleton-dark-color);
  }

  @keyframes skeleton-animation {
    100% {
      background-position: -200% 0;
    }
  }
}
</style>
