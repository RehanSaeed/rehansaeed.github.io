import { onMounted, onUnmounted } from "@vue/composition-api";

/*
 * Registers for the keydown event.
 * @example
 * import useKeydown from "./use-keydown";
 * useKeydown({ key: 'Escape', onKeydown: x => console.log(x) });
 * @example
 * import useKeydown from "./use-keydown";
 * useKeydown([
 *   { key: 'Escape', onKeydown: x => console.log(x) }
 *   { key: 'Enter', onKeydown: x => console.log(x) }
 * ]);
 */
export default function useKeydown(options) {
  function onKeydown(event) {
    const option = Array.isArray(options)
      ? options.find((x) => x.key === event.key)
      : options.key === event.key;
    if (option) {
      option.onKeydown();
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", onKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", onKeydown);
  });
}
