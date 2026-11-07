export function useArticleTraffic() {
  const visible = useState("article-traffic-visible", () => false);
  const initialized = useState("article-traffic-initialized", () => false);
  let activations = 0;
  let lastActivation = 0;

  onMounted(() => {
    if (initialized.value) {
      return;
    }
    initialized.value = true;
    try {
      visible.value =
        sessionStorage.getItem("article-traffic-visible") === "true";
    } catch (error) {
      console.warn("[traffic] Could not restore tab visibility:", error);
    }
  });

  function toggle() {
    visible.value = !visible.value;
    try {
      sessionStorage.setItem("article-traffic-visible", String(visible.value));
    } catch (error) {
      console.warn("[traffic] Could not save visibility for reloads:", error);
    }
  }

  function activate() {
    const now = Date.now();
    activations = now - lastActivation > 3000 ? 1 : activations + 1;
    lastActivation = now;
    if (activations === 5) {
      activations = 0;
      toggle();
    }
  }

  return { visible, activate };
}
