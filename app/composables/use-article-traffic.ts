export function useArticleTraffic() {
  const visible = useState("article-traffic-visible", () => false);
  const initialized = useState("article-traffic-initialized", () => false);

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

  return { visible, toggle };
}
