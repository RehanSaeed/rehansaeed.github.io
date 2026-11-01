<template>
  <div class="mermaid">
    <!-- eslint-disable-next-line vue/no-v-html -- Mermaid renders this SVG with securityLevel: strict. -->
    <div v-if="svg" v-html="svg" />
    <template v-else>
      <pre>{{ code }}</pre>
      <p v-if="failed" role="alert">Unable to display this diagram.</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { loadMermaid } from "~/utils/mermaid";

const props = defineProps<{
  /** Mermaid source to render as a diagram. */ code: string;
}>();
const id = `mermaid-${useId().replace(/:/g, "-")}`;
const svg = ref("");
const failed = ref(false);

onMounted(() => {
  watch(
    () => props.code,
    async (code, _previous, onCleanup) => {
      const state = { cancelled: false };
      const isCancelled = () => state.cancelled;
      onCleanup(() => {
        state.cancelled = true;
      });
      svg.value = "";
      failed.value = false;
      try {
        const mermaid = await loadMermaid();
        await document.fonts.ready;
        if (isCancelled()) {
          return;
        }
        const result = await mermaid.render(id, code);
        if (!isCancelled()) {
          svg.value = result.svg;
        }
      } catch (error) {
        if (!isCancelled()) {
          failed.value = true;
          console.error("Unable to render Mermaid diagram", error);
        }
      }
    },
    { immediate: true },
  );
});
</script>
