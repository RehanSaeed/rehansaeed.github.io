![Muhammad Rehan Saeed](./static/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg)

[![Website Status](https://img.shields.io/website?url=https%3A%2F%2Frehansaeed.com)](https://rehansaeed.com) [![GitHub Actions Status](https://github.com/RehanSaeed/rehansaeed.github.io/workflows/Build/badge.svg?branch=main)](https://github.com/RehanSaeed/rehansaeed.github.io/actions)

[![GitHub Actions Build History](https://buildstats.info/github/chart/RehanSaeed/rehansaeed.github.io?branch=main&includeBuildsFromPullRequest=false)](https://github.com/RehanSaeed/rehansaeed.github.io/actions)

# 🚨 Forking this Repository (Please Read!)

If you want to use this code for your own blog, you can do so but with proper attribution. I spent a non-trivial amount of effort building and designing this iteration of my website, and I am proud of it! All I ask of you all is to not claim this effort as your own.

# Fluid Typography Investigation

CSS `progress(value, start, end)` returns a unitless ratio, clamped between `0` and `1`. It makes fluid typography easier to express as `minimum + progress * (maximum - minimum)`. All three arguments must have compatible types: `100vw`, `500px`, and `1000px` are all lengths.

## A Fluid Base and Type Scale

The following example interpolates both the base font size and the ratio between steps of a modular type scale:

```css
:root {
  --base: 1rem;
  --type-scale: 1.2;
}

@supports (font-size: calc(1rem * progress(100vw, 500px, 1000px))) {
  :root {
    --fluid: progress(100vw, 500px, 1000px);
    --base: calc(1rem + var(--fluid) * (1.125rem - 1rem));
    --type-scale: calc(1.2 + var(--fluid) * (1.414 - 1.2));
  }
}

body {
  font-size: var(--base);
}

h2 {
  font-size: calc(
    var(--base) * var(--type-scale) * var(--type-scale) * var(--type-scale)
  );
}
```

With a `16px` root font size:

| Viewport width | Progress | Base font size | Type scale |
| --- | --- | --- | --- |
| Up to 500px | 0 | 16px | 1.2 |
| 750px | 0.5 | 17px | 1.307 |
| From 1000px | 1 | 18px | 1.414 |

Each heading step multiplies the base by another scale factor. Changing the ratio makes larger headings grow proportionally more than body text; it is not just a replacement for the base-size calculation.

This standalone example leaves the root font size unchanged and applies the fluid base to `body`. Do not also apply the same base to the root while reusing it in headings: the `rem` terms would then resolve against the already-scaled root. Relative font units help preserve user font preferences, but page zoom, text enlargement, wrapping, and clipping still need accessibility checks.

## Applying It to This Site

The site already has fluid typography:

- [`fluid-type()`](src/assets/style/abstracts/_type.scss) generates a minimum, a fluid calculation, and a maximum using media queries.
- [`_properties.scss`](src/assets/style/_properties.scss) sets `--global-font-size-default` from `1em` to `1.25em` between viewport widths of `36em` and `100em`. With the default `16px` browser font, that means `16px` to `20px` between `576px` and `1600px`.
- [`_root.scss`](src/assets/style/dom/_root.scss) applies that token to the root font size. Existing heading and component tokens scale with it.

A behavior-preserving first adoption would retain the existing Sass output as a fallback, then add this override after it:

```css
@supports (font-size: calc(1em * progress(100vw, 36em, 100em))) {
  :root {
    --global-font-size-default: calc(
      1em + 0.25em * progress(100vw, 36em, 100em)
    );
  }
}
```

Keep the current heading multipliers unless a visual redesign is intended. The shared Sass mixin also generates fluid spacing; leave that use unchanged rather than assuming the typography override should replace every mixin call. These examples are proposals only; this investigation does not change production styles.

## Compatibility and Checks

As checked on 22 October 2026, MDN's browser compatibility data lists support for `progress()` in Chrome and Edge 138+, Firefox 155+, and Safari 26+. Retain a fallback for older browsers.

Feature-detect a real property, as in the examples, not an unregistered custom property such as `@supports (--fluid: progress(...))`. Custom properties accept tokens for unsupported functions, so that test does not establish support. An unsupported function substituted through `var()` can invalidate the consuming declaration at computed-value time; an earlier declaration is not a reliable fallback without the support guard.

Isolated browser checks in Edge 155 confirmed matching root and heading sizes for the existing Sass calculation and the proposed override at eight viewport widths from `320px` to `1920px`. The modular-scale example was checked below, within, and above its range, with both `16px` and `32px` root sizes. Chrome 137, which does not support `progress()`, retained the existing Sass fallback at five viewport widths. These checks do not constitute a full-site zoom or accessibility audit.

References: [MDN `progress()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/progress), [MDN browser compatibility data](https://github.com/mdn/browser-compat-data/blob/main/css/types/progress.json), and [CSS Values and Units Level 5](https://drafts.csswg.org/css-values-5/#progress).
