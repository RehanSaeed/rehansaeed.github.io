<template>
  <div class="mermaid">
    <div v-if="svg" v-html="svg" />
    <template v-else>
      <pre>{{ code }}</pre>
      <p v-if="failed" role="alert">Unable to display this diagram.</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { loadMermaid } from "~/utils/mermaid";

const props = defineProps<{ code: string }>();
const id = `mermaid-${useId().replace(/:/g, "-")}`;
const svg = ref("");
const failed = ref(false);

onMounted(() => {
  watch(
    () => props.code,
    async (code, _previous, onCleanup) => {
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      svg.value = "";
      failed.value = false;
      try {
        const mermaid = await loadMermaid();
        await document.fonts.ready;
        if (cancelled) return;
        const result = await mermaid.render(id, code);
        if (!cancelled) svg.value = result.svg;
      } catch (error) {
        if (!cancelled) {
          failed.value = true;
          console.error("Unable to render Mermaid diagram", error);
        }
      }
    },
    { immediate: true },
  );
});
</script>
