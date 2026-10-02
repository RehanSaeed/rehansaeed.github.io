import { onMounted, onUnmounted } from "@vue/composition-api";

/*
 * Registers for a click outside event.
 * @example
 * import useClickOutside from "./use-click-outside";
 * useClickOutside({ container: containerRef, onClickOutside: x => console.log(x) });
 */
export default function useClickOutside(options) {

  function onMouseDown(event) {
    if (options.container.current.contains(event.target)) {
      return;
    }

    options.onClickOutside();
  };

  function onKeyUp(event) {
    if (event.key === 'Escape') {
      options.onClickOutside();
    }

    onMouseDown(e);
  };

  onMounted(() => {
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('touchend', onMouseDown, false);
    document.addEventListener('keyup', onKeyUp);
  });

  onUnmounted(() => {
    document.removeEventListener('mousedown', onMouseDown, false);
    document.removeEventListener('touchend', onMouseDown, false);
    document.removeEventListener('keyup', onKeyUp);
  });
}
