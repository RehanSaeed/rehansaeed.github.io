<template>
  <div
    class="code-block"
    :class="[
      `code-block--tabs-${tabStyle}`,
      { 'code-block--group': alternatives?.length && hydrated },
    ]">
    <div
      v-if="alternatives?.length"
      v-show="hydrated"
      class="code-block__tabs"
      role="tablist"
      aria-orientation="horizontal"
      aria-label="Code alternatives">
      <button
        v-for="(block, index) in blocks"
        :id="`${id}-tab-${index}`"
        :key="index"
        type="button"
        role="tab"
        :aria-selected="selected === index"
        :aria-controls="`${id}-panel-${index}`"
        :tabindex="selected === index ? 0 : -1"
        @click="select(index)"
        @keydown="onTabKey($event, index)">
        {{ block.filename || block.language || `Alternative ${index + 1}` }}
      </button>
    </div>
    <div
      v-for="(block, index) in blocks"
      :id="`${id}-panel-${index}`"
      :key="index"
      :hidden="hydrated && index !== selected"
      :role="alternatives?.length && hydrated ? 'tabpanel' : undefined"
      :aria-labelledby="
        alternatives?.length && hydrated ? `${id}-tab-${index}` : undefined
      "
      :tabindex="alternatives?.length && hydrated ? 0 : undefined">
      <div
        v-if="block.filename && (!alternatives?.length || !hydrated)"
        class="code-title">
        <span>{{ block.filename }}</span>
      </div>
      <div
        class="line-highlight"
        :class="{ 'has-highlighted-lines': block.highlights?.length }"
        :data-language="block.language || 'text'">
        <!-- eslint-disable vue/no-v-html -- Shiki generates this highlighted code HTML at build time. -->
        <pre
          :class="
            preClass(block)
          "><code :class="`language-${block.language || 'text'}`" v-html="block.html || ''" /></pre>
        <!-- eslint-enable vue/no-v-html -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  CodeBlock,
  CodeTabStyle,
} from "../../../shared/utils/code-blocks";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<
    CodeBlock & {
      /** Author-written alternatives displayed as code tabs. */
      alternatives?: CodeBlock[];
      /** Visual treatment used for alternative tabs. */
      tabStyle?: CodeTabStyle;
    }
  >(),
  { language: "text", html: "", tabStyle: "editor-wide" },
);
const id = useId();
const hydrated = ref(false);
const selected = ref(0);
const blocks = computed(() =>
  props.alternatives?.length ? props.alternatives : [props],
);
const hasMeta = (block: CodeBlock, token: string) =>
  block.meta?.split(/\s+/).includes(token) ?? false;

function preClass(block: CodeBlock) {
  return [
    `language-${block.language || "text"}`,
    block.class,
    { "line-numbers": hasMeta(block, "line-numbers") },
  ];
}

function select(index: number) {
  selected.value = index;
}

function onTabKey(event: KeyboardEvent, index: number) {
  const last = blocks.value.length - 1;
  const target = {
    ArrowLeft: index === 0 ? last : index - 1,
    ArrowRight: index === last ? 0 : index + 1,
    Home: 0,
    End: last,
  }[event.key];
  if (target === undefined) {
    return;
  }
  event.preventDefault();
  select(target);
  document.getElementById(`${id}-tab-${target}`)?.focus();
}

onMounted(() => {
  hydrated.value = true;
});
</script>
