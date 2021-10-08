import icon from "~/components/shared/icons/icon.vue";

export default function createIcon(name) {
  return {
    name: name,
    components: {
      "u-icon": icon,
    },
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
  };
}
