<template>
  <div
    class="code-block"
    :class="[
      `code-block--controls-${controls}`,
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
        :class="{
          'has-highlighted-lines': block.highlights?.length,
          'code-block--wrapped': hydrated ? wrapped : hasMeta(block, 'wrap'),
        }"
        :data-language="block.language || 'text'">
        <!-- eslint-disable vue/no-v-html -- Shiki generates this highlighted code HTML at build time. -->
        <pre
          :class="
            preClass(block)
          "><code :class="`language-${block.language || 'text'}`" v-html="block.html || ''" /></pre>
        <!-- eslint-enable vue/no-v-html -->
        <div v-show="hydrated" class="code-block__toolbar">
          <div class="code-block__action">
            <u-tooltip
              v-slot="{ trigger }"
              :text="wrapped ? 'Unwrap lines' : 'Wrap lines'">
              <component
                :is="controlButton"
                v-bind="{ ...controlButtonProps, ...trigger }"
                type="button"
                aria-label="Wrap lines"
                :aria-pressed="wrapped"
                @click="wrap = !wrapped">
                <u-icon
                  name="lucide:wrap-text"
                  class="code-block__icon"
                  :class="{ 'code-block__icon--active': !wrapped }" />
                <u-icon
                  name="lucide:move-right"
                  class="code-block__icon"
                  :class="{ 'code-block__icon--active': wrapped }" />
              </component>
            </u-tooltip>
          </div>
          <div class="code-block__action">
            <u-tooltip
              v-slot="{ trigger }"
              :text="copied ? 'Copied!' : 'Copy code'">
              <component
                :is="controlButton"
                v-bind="{ ...controlButtonProps, ...trigger }"
                type="button"
                :aria-label="copied ? 'Copied!' : 'Copy code'"
                :disabled="copying"
                @click="copy">
                <u-icon
                  name="lucide:copy"
                  class="code-block__icon"
                  :class="{ 'code-block__icon--active': !copied }" />
                <u-icon
                  name="lucide:check"
                  class="code-block__icon"
                  :class="{ 'code-block__icon--active': copied }" />
              </component>
            </u-tooltip>
          </div>
        </div>
      </div>
    </div>
    <span
      class="code-block__status"
      :class="{ 'code-block__status--hidden': copied || !message }"
      role="status"
      aria-live="polite"
      >{{ message }}</span
    >
  </div>
</template>

<script setup lang="ts">
import UButton from "../shared/button.vue";
import type {
  CodeBlock,
  CodeControlStyle,
  CodeTabStyle,
} from "../../../shared/utils/code-blocks";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<
    CodeBlock & {
      alternatives?: CodeBlock[];
      controls?: CodeControlStyle;
      tabStyle?: CodeTabStyle;
    }
  >(),
  { controls: "bordered", tabStyle: "editor-wide" },
);
const controlButton = computed(() =>
  props.controls === "current" ? "button" : UButton,
);
const controlButtonProps = computed(() => {
  if (props.controls === "bordered") return { bordered: true };
  if (props.controls === "soft") return { contrast: true };
  return {};
});
const id = useId();
const hydrated = ref(false);
const selected = ref(0);
const wrap = ref<boolean>();
const copied = ref(false);
const copying = ref(false);
const message = ref("");
let reset: ReturnType<typeof setTimeout> | undefined;
const blocks = computed(() =>
  props.alternatives?.length ? props.alternatives : [props],
);
const hasMeta = (block: CodeBlock, token: string) =>
  block.meta?.split(/\s+/).includes(token) ?? false;
const wrapped = computed(
  () => wrap.value ?? hasMeta(blocks.value[selected.value]!, "wrap"),
);

function preClass(block: CodeBlock) {
  const text = (block.html ?? "").replace(/<[^>]*>/g, "").replace(/\r?\n$/, "");
  return [
    `language-${block.language || "text"}`,
    block.class,
    {
      "line-numbers": hasMeta(block, "line-numbers"),
      "code-block__pre--single-line": !text.includes("\n"),
    },
  ];
}

function select(index: number) {
  selected.value = index;
  clearTimeout(reset);
  copied.value = false;
  message.value = "";
}

function onTabKey(event: KeyboardEvent, index: number) {
  const last = blocks.value.length - 1;
  const target = {
    ArrowLeft: index === 0 ? last : index - 1,
    ArrowRight: index === last ? 0 : index + 1,
    Home: 0,
    End: last,
  }[event.key];
  if (target === undefined) return;
  event.preventDefault();
  select(target);
  document.getElementById(`${id}-tab-${target}`)?.focus();
}

async function copy() {
  const index = selected.value;
  const code = document
    .getElementById(`${id}-panel-${index}`)
    ?.querySelector("code");
  clearTimeout(reset);
  copied.value = false;
  message.value = "";
  copying.value = true;
  try {
    if (!navigator.clipboard?.writeText || !code) {
      throw new Error("Clipboard is unavailable.");
    }
    await navigator.clipboard.writeText(code.textContent ?? "");
    if (selected.value === index) {
      copied.value = true;
      message.value = "Code copied to clipboard.";
      reset = setTimeout(() => {
        copied.value = false;
        message.value = "";
      }, 2500);
    }
  } catch {
    if (selected.value === index) {
      message.value =
        "Could not copy code. Select the code and copy it manually.";
    }
  } finally {
    copying.value = false;
  }
}

onMounted(() => {
  hydrated.value = true;
});
onBeforeUnmount(() => {
  clearTimeout(reset);
});
</script>
