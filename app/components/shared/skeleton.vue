<script>
import {
  Comment,
  Fragment,
  Text,
  h,
  normalizeClass,
  normalizeStyle,
} from "vue";

// Vue's stringifyStyle lives in @vue/shared, which the browser build of vue doesn't re-export.
const stringifyStyle = (style) =>
  typeof style === "string"
    ? style
    : Object.entries(style ?? {})
        .filter(([, v]) => typeof v === "string" || typeof v === "number")
        .map(([key, value]) => {
          const name = key.startsWith("--")
            ? key
            : key.replace(/\B([A-Z])/g, "-$1").toLowerCase();
          return `${name}:${value};`;
        })
        .join("");

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Serialises the slotted SVG vnodes to markup so they can be used as a CSS mask image.
const toHtml = (vnodes) =>
  (vnodes ?? [])
    .map((vnode) => {
      if (vnode == null || typeof vnode === "boolean") {
        return "";
      }
      if (typeof vnode !== "object") {
        return escapeHtml(vnode);
      }
      if (vnode.type === Comment) {
        return "";
      }
      if (vnode.type === Text) {
        return escapeHtml(vnode.children);
      }
      if (vnode.type === Fragment) {
        return toHtml(vnode.children);
      }
      if (typeof vnode.type !== "string") {
        return "";
      }

      const attributes = Object.entries(vnode.props ?? {})
        .filter(
          ([name, value]) =>
            value != null &&
            value !== false &&
            name !== "key" &&
            name !== "ref" &&
            !/^on[A-Z]/.test(name),
        )
        .map(([name, value]) => {
          if (name === "class") {
            value = normalizeClass(value);
          } else if (name === "style") {
            value = stringifyStyle(normalizeStyle(value));
          }
          return value === true
            ? ` ${name}`
            : ` ${name}="${escapeHtml(value)}"`;
        })
        .join("");
      const children = Array.isArray(vnode.children)
        ? toHtml(vnode.children)
        : vnode.children != null
          ? escapeHtml(vnode.children)
          : "";
      return `<${vnode.type}${attributes}>${children}</${vnode.type}>`;
    })
    .join("");

export default {
  name: "u-skeleton",
  data() {
    return {
      isMounted: false,
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
  mounted() {
    // The mask is only applied in the browser, as in Gridsome, so the server and hydration renders
    // match.
    this.isMounted = true;
  },
  render() {
    // Calling the slot here tracks its reactive dependencies, so the mask updates when they change.
    const svg = toHtml(this.$slots.default?.());
    let style;
    if (this.isMounted) {
      const maskImage = `url('data:image/svg+xml;base64,${btoa(svg)}')`;
      style = `-webkit-mask-image: ${maskImage}; mask-image: ${maskImage}; -webkit-mask-repeat: ${this.maskRepeat}; mask-repeat: ${this.maskRepeat};`;
    }
    return h("div", {
      class: "skeleton",
      "aria-busy": this.isBusy,
      style,
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
