<script>
import Vue from "vue";

export default {
  name: "u-skeleton",
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
      const svg = this.toSvg(this.$slots.default);
      const encodedSvg = btoa(svg);
      return `url('data:image/svg+xml;base64,${encodedSvg}')`;
    },
  },
  methods: {
    toSvg(vnodes) {
      const svgRenderer = Vue.extend({
        render: function (h, context) {
          return h(
            "svg",
            {
              attrs: {
                xmlns: "http://www.w3.org/2000/svg",
              },
            },
            vnodes
          );
        },
      });
      const instance = new svgRenderer();
      instance.$mount();
      return instance.$el.outerHTML;
    },
  },
  render(createElement) {
    return createElement("div", {
      attrs: {
        class: "skeleton",
        "aria-busy": this.isBusy,
        style: `-webkit-mask-image: ${this.maskImage}; mask-image: ${this.maskImage}; -webkit-mask-repeat: ${this.maskRepeat}; mask-repeat: ${this.maskRepeat};`,
      },
    });
  },
};
</script>

<style lang="scss">
.skeleton {
  animation: skeleton-animation 2s infinite linear;
  background: linear-gradient(
      to right,
      hsl(30, 1, 99) 0%,
      hsl(30, 2, 95) 30%,
      hsl(30, 2, 95) 70%,
      hsl(30, 1, 99) 100%
    )
    0 0 / 200% 100% hsl(30, 2, 95);
  overflow: hidden;
  position: relative;

  @keyframes skeleton-animation {
    100% {
      background-position: -200% 0;
    }
  }
}
</style>
