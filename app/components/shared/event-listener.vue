<script>
/*
 * @example
 * <u-event-listener
 *   @keydown.meta.70="foo"
 *   @keydown.ctrl.70="bar"
 *   @keydown.space="baz"/>
 */
export default {
  name: "u-event-listener",
  mounted() {
    Object.keys(this.$listeners).forEach((event) => {
      const handler = this.$listeners[event];
      window.addEventListener(event, handler);
    });
  },
  destroyed() {
    Object.keys(this.$listeners).forEach((event) => {
      const handler = this.$listeners[event];
      window.removeEventListener(event, handler);
    });
  },
};
</script>
