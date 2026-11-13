<template>
  <div class="tag-study">
    <header class="tag-study__header">
      <div>
        <p class="tag-study__eyebrow">Design study / styles 6, 8 and 10</p>
        <h1>Small tags. Different personalities.</h1>
        <p>
          Compare the same labels in a blog footer and a portfolio card. Nothing
          here changes the live site or selects a winner.
        </p>
      </div>
      <u-theme-button />
    </header>

    <nav class="tag-study__index" aria-label="Tag style alternatives">
      <a v-for="option of options" :key="option.id" :href="`#${option.id}`">
        {{ option.number }} / {{ option.name }}
      </a>
    </nav>

    <details class="tag-study__baseline">
      <summary>Current default / raised Audiowide buttons (unchanged)</summary>
      <u-tags :tags="blogTags" />
      <u-button variant="secondary">Original raised button</u-button>
    </details>

    <p class="tag-study__instructions">
      Use the moon/sun to compare themes. Tab to any tag for its focus ring;
      hover for the site's raised-button effect. All tags remain real navigation
      links. Narrow the window to compare wrapping.
    </p>

    <section
      v-for="option of options"
      :id="option.id"
      :key="option.id"
      class="tag-study__option"
      :aria-labelledby="`${option.id}-title`">
      <header class="tag-study__option-heading">
        <span class="tag-study__number">{{ option.number }}</span>
        <div>
          <h2 :id="`${option.id}-title`">{{ option.name }}</h2>
          <p>{{ option.description }}</p>
          <code
            >&lt;u-button variant="{{ option.id }}"{{
              iconOptions[option.id] ? " tag-icon" : ""
            }}&gt;</code
          >
          <label v-if="supportsTagIcon(option.id)">
            <input v-model="iconOptions[option.id]" type="checkbox" />
            Add the tag icon
          </label>
          <NuxtLink
            :to="{
              name: 'tag-portfolio-preview',
              query: {
                style: option.id,
                icons: iconOptions[option.id] ? 'tag' : undefined,
              },
            }">
            View the full portfolio with {{ option.name }}
          </NuxtLink>
        </div>
      </header>

      <div class="tag-study__buttons">
        <u-button
          :variant="option.id"
          :tag-icon="iconOptions[option.id]"
          @click="buttonClicks[option.id] = (buttonClicks[option.id] ?? 0) + 1"
          >Example button</u-button
        >
        <u-button
          :variant="option.id"
          :tag-icon="iconOptions[option.id]"
          disabled
          >Disabled button</u-button
        >
        <output aria-live="polite" aria-label="Example button click count"
          >Clicks: {{ buttonClicks[option.id] ?? 0 }}</output
        >
      </div>

      <div class="tag-study__contexts">
        <div class="tag-study__context">
          <p class="tag-study__eyebrow">Blog / end of article</p>
          <u-card tag="article" class="tag-study__blog">
            <header>
              <p class="tag-study__meta">04 November 2026 / Web</p>
              <h3>
                <NuxtLink to="/ai-learnings-from-upgrading-my-blog/">
                  AI Learnings from Upgrading My Blog
                </NuxtLink>
              </h3>
            </header>
            <p>
              Six lessons from migrating my blog from Gridsome to Nuxt with
              GitHub Copilot, from strict linting and agent instructions to
              parallel experiments.
            </p>
            <footer class="tag-study__footer">
              <span class="tag-study__meta">Filed under</span>
              <u-tags
                :tags="blogTags"
                :variant="option.id"
                :tag-icon="iconOptions[option.id]" />
            </footer>
          </u-card>
        </div>
        <div class="tag-study__context">
          <p class="tag-study__eyebrow">Portfolio / project card</p>
          <u-portfolio-card
            :portfolio="{ ...portfolio, id: option.id }"
            :tag-variant="option.id"
            :tag-icon="iconOptions[option.id]" />
        </div>
      </div>
    </section>

    <footer class="tag-study__notes">
      <h2>Review notes</h2>
      <p>
        The blog excerpt and project description come from existing content.
        Both samples deliberately mix short and long, existing tag labels to
        stress wrapping; these are comparison labels, not changes to metadata.
        The original UTags and portfolio-card components render the links.
      </p>
      <p>
        Local preview: <code>npm run dev -- --port 8097</code>, then open
        <code>/__design/tags/</code>. This page is registered only in
        development, has no navigation entry and requests no indexing.
      </p>
      <a href="#empty">Back to top</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {
  supportsTagIcon,
  tagStyleOptions as options,
} from "./tag-style-options";
import type { TagButtonVariant } from "~/types/button";

definePageMeta({ layout: "empty" });
useHead({ title: "Tag style comparison" });
useSeoMeta({ robots: "noindex, nofollow" });

const blogTags = [
  "C#",
  "Nuxt.js",
  "GitHub Copilot",
  "Artificial Intelligence (AI)",
  "Static Site Generator",
];
const portfolio = {
  id: "comparison",
  title: ".NET Boxed",
  description:
    ".NET project templates with batteries included, providing the minimum amount of code required to get you going faster.",
  heroImage: "",
  permalink: "https://github.com/Dotnet-Boxed/Templates",
  tags: ["C#", ".NET", "ASP.NET", ".NET Boxed", "Continuous Integration"],
  repository: undefined,
  stars: 0,
  forks: 0,
  nugetPackages: [],
  nugetDownloads: 0,
};
const buttonClicks = reactive<Partial<Record<TagButtonVariant, number>>>({});
const iconOptions = reactive<Partial<Record<TagButtonVariant, boolean>>>({});
</script>

<style lang="scss">
.tag-study {
  display: grid;
  gap: 2rem;
  max-inline-size: 80rem;
  margin-inline: auto;
  padding: clamp(1rem, 3vw, 3rem);
}

.tag-study__header {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;

  h1 {
    max-inline-size: 20ch;
    margin-block: 0.5rem 1rem;
    font-size: clamp(1.7rem, 3.5vw, 3rem);
  }

  p {
    margin-block: 0;
  }

  .theme-button {
    min-inline-size: 44px;
    min-block-size: 44px;
  }
}

.tag-study__eyebrow,
.tag-study__meta {
  color: var(--global-body-color);
  font-size: 0.8rem;
}

.tag-study__eyebrow {
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tag-study__index {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;

  a {
    padding-block: 0.3rem;
    font-size: 0.85rem;
    text-underline-offset: 0.25em;
  }
}

.tag-study__baseline {
  border: 1px solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  padding: 1rem;

  summary {
    cursor: pointer;
    color: var(--global-title-color);
  }

  .tags {
    margin-block-start: 1rem;
  }
}

.tag-study__instructions {
  margin-block: 0;
  font-size: 0.85rem;
}

.tag-study__option {
  display: grid;
  gap: 1.25rem;
  border-block-start: 1px solid var(--global-border-color);
  padding-block-start: 2rem;
  scroll-margin-block-start: 1rem;
}

.tag-study__option-heading {
  display: grid;
  gap: 1rem;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;

  h2 {
    margin-block: 0 0.35rem;
    font-size: 1.3rem;
  }

  p {
    margin-block: 0;
    font-size: 0.85rem;
  }
}

.tag-study__number {
  color: var(--global-accent-color);
  font-family: var(--global-font-family-monospace);
  font-size: 1.3rem;
}

.tag-study__contexts {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  align-items: start;
}

.tag-study__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.tag-study__context {
  min-inline-size: 0;

  > .tag-study__eyebrow {
    margin-block: 0 0.75rem;
  }

  .card {
    --card-space: clamp(1rem, 2.5vw, 2rem);
  }

  .portfolio-card {
    max-inline-size: none;
  }
}

.tag-study__blog {
  h3 {
    margin-block: 0.5rem 1rem;
    font-size: 1.1rem;
  }

  p {
    min-inline-size: 0;
    margin-block: 0 1.25rem;
    font-size: 0.95rem;
  }

  .tag-study__meta {
    font-size: 0.8rem;
  }
}

.tag-study__footer {
  display: grid;
  gap: 0.75rem;
  border-block-start: 1px solid var(--global-border-color);
  padding-block-start: 1rem;
}

.tag-study__notes {
  border-block-start: 1px solid var(--global-border-color);
  padding-block-start: 1rem;
  font-size: 0.85rem;
}

@media (width < 800px) {
  .tag-study__contexts {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
