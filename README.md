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

## Social image previews

Each post's social card uses its title and hero image. Listing and static pages
use their own title with the default site hero. The cards share the current SVG
avatar, `RehanSaeed.com` branding and the `Software Developer · Open Source` tagline.
The title sits directly below the site name, with the author block at the bottom.

After `npm run build`, run `npm run og:gallery` and open `.nuxt/og-images.html`
to inspect every generated page's `og:image`, including unlisted pages. The
searchable gallery embeds compact previews so it works offline, links to the
full-size PNGs after deployment, and flags pages without a social image.
Pass an output filename to save it elsewhere:
`npm run og:gallery -- path/to/gallery.html`. The gallery is a local review
artifact, not a published site page.

## Contributing

Bug reports and improvements are welcome. Read the
[contributing guide](./.github/CONTRIBUTING.md) and
[code of conduct](./.github/CODE_OF_CONDUCT.md) before opening an
[issue](https://github.com/RehanSaeed/rehansaeed.github.io/issues) or pull request.
