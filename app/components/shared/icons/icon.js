export default function createIcon(name) {
  return {
    name: name,
    props: {
      inline: {
        default: false,
        type: Boolean,
      },
      title: {
        default: undefined,
        type: String,
      },
    },
    computed: {
      svgClass() {
        return this.inline ? "icon icon--inline" : "icon";
      },
    },
  };
}
