<script>
import Vue from "vue";

const TitleTagName = "title";

export default {
  name: "u-icon",
  computed: {
    inline() {
      return this.$parent.$options.propsData.inline;
    },
    title() {
      return this.$parent.$options.propsData.title;
    },
  },
  render(createElement) {
    const svg = this.$slots.default[0];
    const attrs = svg.data.attrs;

    const inline = this.inline;
    if (inline === "") {
      svg.data.staticClass = "icon icon--inline";
    } else {
      svg.data.staticClass = "icon";
    }

    attrs.xmlns = "http://www.w3.org/2000/svg";
    attrs["aria-hidden"] = "true";
    attrs.focusable = "false";
    attrs.role = "img";

    const title = this.title;
    if (title) {
      if (svg.children.length && svg.children[0].tag === TitleTagName) {
        svg.children[0].children[0].text = title;
      } else {
        svg.children.splice(0, 0, createElement(TitleTagName, title));
      }
    }

    return this.$slots.default;
  },
};
</script>

<style lang="scss">
.icon {
  display: block;
  width: 1em;
}

.icon--inline {
  display: inline;
}
</style>
