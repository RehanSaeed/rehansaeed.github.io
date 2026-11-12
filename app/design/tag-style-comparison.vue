<template>
  <div class="tag-study">
    <header class="tag-study__header">
      <div>
        <p class="tag-study__eyebrow">Design study / 10 alternatives</p>
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
    </details>

    <p class="tag-study__instructions">
      Use the moon/sun to compare themes. Tab to any tag for its focus ring;
      hover for the site's raised-button effect and an underline. All tags
      remain real navigation links. Narrow the window to compare wrapping.
    </p>

    <section
      v-for="option of options"
      :id="option.id"
      :key="option.id"
      class="tag-study__option"
      :class="`tag-study__option--${option.id}`"
      :aria-labelledby="`${option.id}-title`">
      <header class="tag-study__option-heading">
        <span class="tag-study__number">{{ option.number }}</span>
        <div>
          <h2 :id="`${option.id}-title`">{{ option.name }}</h2>
          <p>{{ option.description }}</p>
        </div>
      </header>

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
              <u-tags :tags="blogTags" />
            </footer>
          </u-card>
        </div>
        <div class="tag-study__context">
          <p class="tag-study__eyebrow">Portfolio / project card</p>
          <u-portfolio-card :portfolio="{ ...portfolio, id: option.id }" />
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
const options = [
  {
    number: "01",
    id: "quiet-pill",
    name: "Quiet pill",
    description:
      "Soft lavender wash, fully rounded, compact sans-serif. Low visual weight.",
  },
  {
    number: "02",
    id: "hairline-capsule",
    name: "Hairline capsule",
    description:
      "Open accent outline with the site's Audiowide lettering. No elevation at rest.",
  },
  {
    number: "03",
    id: "topic-dot",
    name: "Topic dot",
    description:
      "Unboxed text with a small circular marker and generous horizontal space.",
  },
  {
    number: "04",
    id: "solid-lozenge",
    name: "Solid lozenge",
    description:
      "Filled accent, contrasting semibold text, tight rectangular silhouette.",
  },
  {
    number: "05",
    id: "editorial-index",
    name: "Editorial index",
    description:
      "Serif italics and a fine underline. More reading list than UI control.",
  },
  {
    number: "06",
    id: "code-token",
    name: "Code token",
    description:
      "Monospace on a neutral slab with a precise accent rule. Developer-native.",
  },
  {
    number: "07",
    id: "ticket-stub",
    name: "Ticket stub",
    description:
      "Dashed outline, pinched corners and airy tracking. A tactile label.",
  },
  {
    number: "08",
    id: "keycap",
    name: "Keycap",
    description:
      "Monospace, rounded-square corners and a solid lower edge. Deliberately raised.",
  },
  {
    number: "09",
    id: "corner-tab",
    name: "Corner tab",
    description:
      "Asymmetric rounded corner and a bold leading edge. A small folder tab.",
  },
  {
    number: "10",
    id: "tag-label",
    name: "Tag label",
    description:
      "Decorative tag outline, soft border and medium-weight text. Explicit taxonomy.",
  },
];
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

// Only comparison sections opt in; the real UTags default remains untouched.
.tag-study__option {
  .tags {
    gap: 0.5rem;
  }

  .tags__link {
    display: inline-flex;
    gap: 0.45em;
    align-items: center;
    min-inline-size: 24px;
    max-inline-size: 100%;
    min-block-size: 36px;
    border: 1px solid transparent;
    border-radius: 0;
    padding: 0.35rem 0.75rem;
    background: transparent;
    box-shadow: none;
    color: var(--global-accent-color);
    font-family: var(--global-font-family-sans-serif);
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.5;
    overflow-wrap: anywhere;
    text-decoration: none;
    text-underline-offset: 0.2em;
    opacity: 1;

    &:hover,
    &:focus-visible {
      text-decoration: underline;
      text-decoration-thickness: 2px;
    }

    &:focus-visible {
      outline: 3px solid var(--global-accent-color);
      outline-offset: 4px;
    }
  }
}

.tag-study__option--quiet-pill .tags__link {
  border-radius: 999px;
  background: color-mix(in srgb, var(--global-accent-color) 9%, transparent);
}

.tag-study__option--hairline-capsule .tags__link {
  border-color: var(--global-accent-color);
  border-radius: 999px;
  padding-inline: 1rem;
  font-family: var(--font-heading);
  font-size: 0.8rem;
}

.tag-study__option--topic-dot {
  .tags {
    column-gap: 1.25rem;
  }

  .tags__link {
    padding-inline: 0;
    color: var(--global-title-color);

    // Leave ::before available for ULinkButton's raised shadow.
    &::after {
      content: "";
      order: -1;
      flex: 0 0 0.4rem;
      block-size: 0.4rem;
      border: 1px solid currentColor;
      border-radius: 50%;
      background: var(--global-accent-color);
      color: var(--global-accent-color);
    }
  }
}

.tag-study__option--solid-lozenge .tags__link {
  border-radius: 0.3rem;
  background: var(--global-accent-color);
  color: var(--global-content-background-color);
  font-weight: 600;
}

.tag-study__option--editorial-index {
  .tags {
    column-gap: 1.25rem;
  }

  .tags__link {
    border-block-end-color: currentColor;
    padding-inline: 0.1rem;
    font-family: var(--global-font-family-serif);
    font-size: 1rem;
    font-style: italic;
  }
}

.tag-study__option--code-token .tags__link {
  border-inline-start: 3px solid var(--global-accent-color);
  background: var(--global-background-color);
  color: var(--global-title-color);
  font-family: var(--global-font-family-monospace);
  font-size: 0.8rem;
}

.tag-study__option--ticket-stub .tags__link {
  border: 1px dashed var(--global-accent-color);
  border-radius: 0.8rem 0.2rem;
  padding-inline: 0.9rem;
  letter-spacing: 0.04em;
}

.tag-study__option--keycap .tags__link {
  border: 1px solid var(--global-accent-color);
  border-block-end-width: 3px;
  border-radius: 0.4rem;
  background: var(--global-background-color);
  box-shadow: 0 2px 0 var(--global-border-color);
  color: var(--global-title-color);
  font-family: var(--global-font-family-monospace);
  font-size: 0.8rem;
}

.tag-study__option--corner-tab .tags__link {
  border-inline-start: 4px solid var(--global-accent-color);
  border-start-end-radius: 1rem;
  padding-inline: 0.65rem 1rem;
  background: color-mix(in srgb, var(--global-accent-color) 9%, transparent);
  font-family: var(--font-heading);
  font-size: 0.8rem;
}

.tag-study__option--tag-label .tags__link {
  border-color: var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-background-color);
  color: var(--global-title-color);
  font-weight: 600;

  &::after {
    content: "";
    order: -1;
    flex: 0 0 1em;
    block-size: 1em;
    background: var(--global-accent-color);
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='2' stroke-linejoin='round' d='M3 3h7l11 11-7 7L3 10V3Z'/%3E%3Ccircle cx='7.5' cy='7.5' r='1.5'/%3E%3C/svg%3E")
      center / contain no-repeat;
  }
}

@media (width < 800px) {
  .tag-study__contexts {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tag-study__option .tags__link {
    transform: none;
    transition: none;

    &::before {
      transition: none;
    }
  }
}

@media (forced-colors: active) {
  .tag-study__option .tags__link {
    border-color: LinkText;
    background: Canvas;
    box-shadow: none;
    color: LinkText;

    &:focus-visible {
      outline-color: Highlight;
    }

    &::before {
      box-shadow: none;
    }

    &::after {
      background: LinkText;
      color: LinkText;
    }
  }
}
</style>
