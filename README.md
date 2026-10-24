# Muhammad Rehan Saeed's Website

[![Build](https://github.com/RehanSaeed/rehansaeed.github.io/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/RehanSaeed/rehansaeed.github.io/actions/workflows/build.yml)
[![GitHub Pages](https://img.shields.io/github/deployments/RehanSaeed/rehansaeed.github.io/github-pages?label=GitHub%20Pages&logo=github)](https://rehansaeed.com)
[![Website Status](https://img.shields.io/website?url=https%3A%2F%2Frehansaeed.com)](https://rehansaeed.com)

[![Muhammad Rehan Saeed](./public/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg)](https://rehansaeed.com)

Source for [rehansaeed.com](https://rehansaeed.com), my software engineering blog
and portfolio. Built with [Nuxt](https://nuxt.com), [Vue](https://vuejs.org) and
[Nuxt Content](https://content.nuxt.com), and published as a static site on
[GitHub Pages](https://docs.github.com/en/pages).

## Getting started

Install [Node.js](https://nodejs.org) **24.15+ in the 24.x LTS line, or 26+**,
and [Git LFS](https://git-lfs.com) for the repository's images and fonts.

```sh
git clone https://github.com/RehanSaeed/rehansaeed.github.io.git
cd rehansaeed.github.io
git lfs install
git lfs pull
npm ci
npm run dev
```

Open the local URL printed by Nuxt. Optional analytics configuration is documented
in [`.env.example`](./.env.example); no analytics ID is needed for local development.

## Commands

| Command             | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Start the development server.                                 |
| `npm run build`     | Generate `dist` and validate the static site and SEO artifacts. |
| `npm start`         | Preview the generated `dist` at `http://localhost:8080`.        |
| `npm run typecheck` | Check TypeScript and Vue templates.                            |
| `npm run lint`      | Run ESLint with zero warnings allowed.                         |
| `npm test`          | Run Playwright tests in Chrome, Edge and Firefox.              |

Before opening a pull request, run the build, type check, lint and tests.
Install the [Playwright browsers](https://playwright.dev/docs/browsers) if needed.
The [Build workflow](./.github/workflows/build.yml) runs these checks and deploys
successful builds from `main` to GitHub Pages; pull requests do not deploy.

## Repository layout

| Path                        | Contents                                     |
| --------------------------- | -------------------------------------------- |
| [`app`](./app)               | Vue components, pages, layouts and styles.    |
| [`content`](./content)       | Markdown blog posts and portfolio content.    |
| [`public`](./public)         | Images, fonts and other static files.         |
| [`scripts`](./scripts)       | Build validation and deployment tools.        |
| [`tests`](./tests)           | Playwright tests and visual regression tests. |
| [`.github`](./.github)       | GitHub Actions workflows and community docs.  |

## Contributing

Bug reports and improvements are welcome. Read the
[contributing guide](./.github/CONTRIBUTING.md) and
[code of conduct](./.github/CODE_OF_CONDUCT.md) before opening an
[issue](https://github.com/RehanSaeed/rehansaeed.github.io/issues) or pull request.

## Forking this repository

If you want to use this code for your own blog, you can do so but with proper
attribution. I spent a non-trivial amount of effort building and designing this
iteration of my website, and I am proud of it! All I ask of you all is to not claim
this effort as your own.
