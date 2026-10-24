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

The contact address is stored encoded and decoded only when the Email link is
activated, not during page rendering or hydration. This deters passive scraping;
it is not encryption.

## Contributing

Bug reports and improvements are welcome. Read the
[contributing guide](./.github/CONTRIBUTING.md) and
[code of conduct](./.github/CODE_OF_CONDUCT.md) before opening an
[issue](https://github.com/RehanSaeed/rehansaeed.github.io/issues) or pull request.

## Profile photo exports

Regenerate the portrait, square avatars, PNG app icons and ICO favicon from the
full-resolution, unposterized portrait, not a previously compressed square export:

```powershell
node scripts/profile-images.mjs "<full-resolution portrait.jpg>" 295
```

The second argument is the square crop's top offset in source pixels. `295` preserves
the current framing of the 5464 x 8192 original. The script keeps the existing asset
URLs and dimensions and leaves the purple SVG artwork unchanged.

PNG photos must remain truecolour, not indexed/palette PNGs. Both image-compression
workflows exclude these exports to prevent colour banding from palette reduction.
The original photo stays outside the repository.
