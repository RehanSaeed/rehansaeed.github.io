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

## PWA installation

The manifest is configured in `nuxt.config.ts`. It keeps a stable `/` app ID,
start URL and scope, and uses `minimal-ui`. Orientation is intentionally omitted
so readers can use either portrait or landscape.

Chrome's richer desktop install dialog needs a screenshot with
`form_factor: "wide"`; mobile screenshots use `"narrow"`. These previews are
separate from install eligibility: missing screenshots do not prevent basic
installation.

The navigation install button appears only after a supporting browser emits
`beforeinstallprompt`. In Chrome, use HTTPS (or localhost), a normal browser
profile where the app is not already installed, interact with the page, and
allow time for engagement checks (currently at least one click/tap and 30 seconds
of viewing). A previously dismissed promotion can also be suppressed by the
browser. Safari and Firefox do not expose this event; use their browser-specific
install or Add to Home Screen UI where available. Check Chrome DevTools >
Application > Manifest for installability errors.

To refresh the six install previews from the current site, run `npm run build`,
then `npm start` in another terminal, then `npm run pwa:screenshots`. This uses
Playwright Chromium (`npx playwright install chromium`) to capture Blog,
Portfolio and About at 1440x900 and 390x844 in light mode. Rebuild afterward so
the new assets are included in the static output and service-worker precache.

## Contributing

Bug reports and improvements are welcome. Read the
[contributing guide](./.github/CONTRIBUTING.md) and
[code of conduct](./.github/CODE_OF_CONDUCT.md) before opening an
[issue](https://github.com/RehanSaeed/rehansaeed.github.io/issues) or pull request.
