[![Muhammad Rehan Saeed](./public/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg)](https://rehansaeed.com)

[![Build](https://github.com/RehanSaeed/rehansaeed.github.io/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/RehanSaeed/rehansaeed.github.io/actions/workflows/build.yml)
[![GitHub Pages](https://img.shields.io/github/deployments/RehanSaeed/rehansaeed.github.io/github-pages?label=GitHub%20Pages&logo=github)](https://rehansaeed.com)
[![Website Status](https://img.shields.io/website?url=https%3A%2F%2Frehansaeed.com)](https://rehansaeed.com)

# 🚨 Forking this Repository (Please Read!)

If you want to use this code for your own blog, you can do so but with proper
attribution. I spent a non-trivial amount of effort building and designing this
iteration of my website, and I am proud of it! All I ask of you all is to not claim
this effort as your own.

## About

Source for [rehansaeed.com](https://rehansaeed.com), my software engineering blog
and portfolio. Built with [Nuxt](https://nuxt.com), [Vue](https://vuejs.org) and
[Nuxt Content](https://content.nuxt.com). Published as a static site on
[GitHub Pages](https://docs.github.com/en/pages).

## Contributing

Bug reports and improvements are welcome. Read the
[contributing guide](./.github/CONTRIBUTING.md) and
[code of conduct](./.github/CODE_OF_CONDUCT.md) before opening an
[issue](https://github.com/RehanSaeed/rehansaeed.github.io/issues) or pull request.

## Lighthouse CI

The Build workflow audits the generated homepage, About, Portfolio and a blog
article with Playwright's pinned Chromium. Each page is measured three times.
Lighthouse failures block deployment, and the `lighthouse-report` Actions artifact
retains HTML/JSON reports and assertion results for seven days, including when
assertions fail. Reports are not sent to temporary public storage.

To run the same checks locally with the Node version in `.nvmrc`:

```shell
npm ci
npx playwright install --with-deps chromium
npm run build
npm run lighthouse
```

Site generation needs `GITHUB_TOKEN` for its GitHub data snapshots. To use another
installed Chrome, set `CHROME_PATH` to its executable before running Lighthouse.
Local reports are written to `.lighthouseci/reports`.
On GitHub Actions only, Chromium runs with `--no-sandbox` because the hosted
Ubuntu AppArmor policy does not allow the downloaded browser's sandbox.

The configuration extends the recommended assertions and requires **100** for
accessibility, best practices and SEO. Performance scores below **90** produce
warnings using the median of three runs; timing measurements remain warnings,
as in the recommended preset. The following exceptions remain visible warnings:

- Back/forward cache can fail with Chromium's non-actionable
  `Internal error / IgnoreEventAndEvict`.
- Image-delivery diagnostics can flag correctly selected high-density images;
  regression tests check mobile candidates at 1x, 1.75x and 2x density.
- Network-dependency diagnostics flag the same-origin stylesheet/manifest chain.
- Forced-reflow diagnostics currently report browser layout as `[unattributed]`
  without an actionable script location; they remain visible timing warnings.
- Unused JavaScript and non-composited animations were previously disabled;
  they now warn rather than disappearing from the results.

Lighthouse CI currently pins an older engine, so `package.json` overrides it with
Lighthouse 13.5.0. `lighthouserc.js` explicitly excludes retired audit IDs from the
older recommended preset; update this list when upgrading the engine.

The site uses responsive mobile image candidates, article-only KaTeX styles and
an on-demand search engine. Server-rendered content
is no longer faded out during initial hydration. Pagination omits unavailable
links, and `robots.txt` retains the explicit search, AI-input and AI-training
opt-ins through `Content-Signal`, without the redundant legacy `Content-Usage`
directive that Lighthouse rejects.

About and Portfolio prioritize their above-the-fold images. Portfolio badges
reserve image space while CSS preserves their natural proportions, and the wide
About badge uses its correct aspect ratio. About uses a cookie-free Shields
reputation badge instead of Stack Overflow's blocked third-party flair image;
the profile link is unchanged, but medal counts are no longer shown. Article
heading permalinks have accessible names and remain visible on keyboard focus.
