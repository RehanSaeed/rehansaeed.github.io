<template>
  <div
    class="controls-lab"
    :class="{
      'controls-lab--revealed': reveal,
      'controls-lab--narrow': narrow,
    }">
    <header class="controls-lab__header">
      <div>
        <p class="controls-lab__eyebrow">Local design playground</p>
        <h1>Code block playground</h1>
        <p>
          Compare five tab styles and five button treatments using real code
          blocks. The blog still uses attached tabs and bordered controls.
        </p>
      </div>
      <u-theme-button />
    </header>
    <div class="controls-lab__options">
      <label
        ><input v-model="reveal" type="checkbox" :disabled="!hydrated" /> Show
        all controls</label
      >
      <label
        ><input v-model="narrow" type="checkbox" :disabled="!hydrated" /> Narrow
        examples</label
      >
      <span>Try hover, keyboard focus, copy, wrap and light/dark themes.</span>
    </div>
    <h2 id="tab-styles">Alternative-code tabs</h2>
    <p>
      Switch between Bash and PowerShell, try the arrow keys, copy and wrap, or
      change the theme. Each card is independent.
    </p>
    <div class="controls-lab__grid">
      <section
        v-for="option in tabOptions"
        :key="option.id"
        class="controls-lab__card"
        :aria-labelledby="`tab-heading-${option.id}`"
        :data-tab-style="option.id">
        <h3 :id="`tab-heading-${option.id}`">{{ option.title }}</h3>
        <p>{{ option.description }}</p>
        <div class="controls-lab__example">
          <ContentRenderer :value="{ body: tabExampleBody(option.id) }" />
        </div>
        <label class="controls-lab__choice">
          <input
            v-model="tabChoice"
            type="radio"
            :disabled="!hydrated"
            name="tab-preference"
            :value="option.id" />
          Prefer {{ option.title }}
        </label>
      </section>
    </div>
    <p class="controls-lab__selection" role="status" data-tab-preference>
      {{
        selectedTab
          ? `Tab preference: ${selectedTab.title}.`
          : "No tab preference selected yet."
      }}
      This selection is local only; it does not change the blog.
    </p>
    <h2 id="button-styles">Copy and wrap buttons</h2>
    <div class="controls-lab__grid">
      <section
        v-for="option in options"
        :key="option.id"
        class="controls-lab__card"
        :aria-labelledby="`heading-${option.id}`"
        :data-style="option.id">
        <h3 :id="`heading-${option.id}`">
          {{ option.letter }}. {{ option.title }}
        </h3>
        <p>{{ option.description }}</p>
        <div class="controls-lab__example">
          <ContentRenderer :value="{ body: exampleBody(option.id) }" />
        </div>
        <label class="controls-lab__choice">
          <input
            v-model="choice"
            type="radio"
            :disabled="!hydrated"
            name="preference"
            :value="option.id" />
          Prefer {{ option.letter }}
        </label>
      </section>
    </div>
    <p class="controls-lab__selection" role="status" data-control-preference>
      {{
        selected
          ? `Preference: ${selected.letter}. ${selected.title}.`
          : "No preference selected yet."
      }}
      This selection is only for comparison; it does not change the blog.
    </p>
  </div>
</template>

<script setup lang="ts">
import type {
  CodeControlStyle,
  CodeTabStyle,
} from "../../shared/utils/code-blocks";

definePageMeta({ layout: "empty" });
useHead({ title: "Code control playground" });
useRobotsRule("noindex, nofollow");

const hydrated = ref(false);
onMounted(() => {
  hydrated.value = true;
});
const reveal = ref(false);
const narrow = ref(false);
const choice = ref<CodeControlStyle>();
const tabChoice = ref<CodeTabStyle>();
const tabOptions = [
  {
    id: "attached",
    title: "Attached",
    description: "The current style: the selected tab joins the code panel.",
  },
  {
    id: "underline",
    title: "Underline",
    description:
      "A quiet label row with an accent underline on the active tab.",
  },
  {
    id: "segmented",
    title: "Segmented",
    description:
      "Equal-width choices in a shared header, with a raised selected segment.",
  },
  {
    id: "pills",
    title: "Pills",
    description:
      "Rounded choices in a compact header, with an outlined active pill.",
  },
  {
    id: "editor",
    title: "Editor",
    description:
      "A file-tab strip with dividers, monospace labels and an accent top edge.",
  },
] as const;
const selectedTab = computed(() =>
  tabOptions.find((option) => option.id === tabChoice.value),
);
const options = [
  {
    id: "current",
    letter: "A",
    title: "Original custom controls",
    description:
      "Individual native buttons with borders, a surface and a small shadow.",
  },
  {
    id: "plain",
    letter: "B",
    title: "Existing UButton",
    description:
      "The real shared button: bare icons and the existing colour/scale interaction.",
  },
  {
    id: "bordered",
    letter: "C",
    title: "Existing UButton, bordered",
    description:
      "The shared button's existing bordered treatment, including its lift and shadow.",
  },
  {
    id: "soft",
    letter: "D",
    title: "Soft UButton",
    description:
      "The shared contrast button on a rounded surface, without a border or shadow.",
  },
  {
    id: "grouped",
    letter: "E",
    title: "Grouped UButton",
    description:
      "Two shared plain buttons in a single bordered surface with a divider.",
  },
] as const;
const selected = computed(() =>
  options.find((option) => option.id === choice.value),
);

const { data: post, error } = await useAsyncData("code-control-sample", () =>
  queryCollection("posts")
    .where("permalink", "=", "/cheat-sheet/")
    .select("body")
    .first(),
);
if (error.value) throw error.value;
if (!post.value)
  throw createError({
    statusCode: 500,
    statusMessage: "Code comparison sample is missing.",
  });

type Element = [string, Record<string, unknown>, ...unknown[]];
function isElement(node: unknown): node is Element {
  return (
    Array.isArray(node) &&
    typeof node[0] === "string" &&
    typeof node[1] === "object" &&
    node[1] !== null
  );
}
const nodes: unknown[] = post.value.body.value;
const elements = nodes.filter(isElement);
const sample = elements.find(
  (node) => node[0] === "pre" && node[1].filename === "Wrapped code",
);
if (!sample)
  throw createError({
    statusCode: 500,
    statusMessage: "Highlighted code comparison sample is missing.",
  });
const styles = elements.filter((node) => node[0] === "style");
const groupSample = elements.find(
  (node) => node[0] === "pre" && Array.isArray(node[1].alternatives),
);
if (!groupSample)
  throw createError({
    statusCode: 500,
    statusMessage: "Highlighted tab comparison sample is missing.",
  });
const groupProps = groupSample[1];
function tabExampleBody(tabStyle: CodeTabStyle) {
  return {
    type: "minimark",
    value: [...styles, ["pre", { ...groupProps, tabStyle }]],
  };
}
const sampleProps = sample[1];
function exampleBody(controls: CodeControlStyle) {
  return {
    type: "minimark",
    value: [
      ...styles,
      ["pre", { ...sampleProps, meta: "line-numbers", controls }],
    ],
  };
}
</script>

<style scoped lang="scss">
.controls-lab {
  max-inline-size: 100rem;
  margin-inline: auto;
  padding: clamp(1rem, 3vw, 3rem);
}
.controls-lab__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 2rem;
  margin-block-end: 1.5rem;

  h1 {
    margin-block: 0.5rem 1rem;
  }
  p {
    max-inline-size: 65ch;
  }
}
.controls-lab__eyebrow {
  color: var(--global-accent-color);
}
.controls-lab__options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  padding-block: 1rem;
  margin-block-end: 1rem;
  border-block: var(--global-border-width-1) solid var(--global-border-color);

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  span {
    color: var(--global-body-color);
  }
}
.controls-lab__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 30rem), 1fr));
  gap: 1.5rem;
}
.controls-lab__card {
  min-inline-size: 0;
  padding: 1.5rem;
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-content-background-color);

  h2,
  h3 {
    font-family: var(--global-font-family-sans-serif);
    font-size: 1.25rem;
    margin-block-end: 0.75rem;
  }
  > p {
    min-block-size: 3em;
  }
}
.controls-lab__example {
  min-inline-size: 0;
}
.controls-lab--narrow .controls-lab__example {
  max-inline-size: 20rem;
}
.controls-lab--revealed :deep(.code-block__toolbar) {
  opacity: 1;
  pointer-events: auto;
}
.controls-lab__choice {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding-block: 0.75rem;
  cursor: pointer;
}
.controls-lab__selection {
  margin-block-start: 1.5rem;
}
</style>
