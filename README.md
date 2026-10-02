![Muhammad Rehan Saeed](./public/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg)

[![Website Status](https://img.shields.io/website?url=https%3A%2F%2Frehansaeed.com)](https://rehansaeed.com) [![GitHub Actions Status](https://github.com/RehanSaeed/rehansaeed.github.io/workflows/Build/badge.svg?branch=main)](https://github.com/RehanSaeed/rehansaeed.github.io/actions)

[![GitHub Actions Build History](https://buildstats.info/github/chart/RehanSaeed/rehansaeed.github.io?branch=main&includeBuildsFromPullRequest=false)](https://github.com/RehanSaeed/rehansaeed.github.io/actions)

# 🚨 Forking this Repository (Please Read!)

If you want to use this code for your own blog, you can do so but with proper attribution. I spent a non-trivial amount of effort building and designing this iteration of my website, and I am proud of it! All I ask of you all is to not claim this effort as your own.

## Development

Use Node.js 24.11 or later in the 24.x LTS line, or Node.js 26+. Run `npm ci`, then `npm run dev`. Before pushing, run
`npm run build`, `npm run typecheck`, and `npm test`. The build prerenders the site
into `dist`; `npm start` serves that exact artifact. `npm run analyze` writes its
report outside the published directory.

## Static build decisions

The documentation audit inventories the official Nuxt 4, Content, Image, Sitemap
and Vite PWA documentation and checks applicable guidance against the installed
versions. It is not a claim that every upstream page has been read line by line.

| Area          | Configuration and rationale                                                                                                                                                                                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rendering     | SSR plus `nuxt generate`, explicit routes for unlinked posts and tags, extracted navigation payloads, and fail-on-error prerendering. Four concurrent prerender requests reduce build overhead without unbounded parallelism.                                                                                                                                        |
| Accessibility | Nuxt's [route announcer](https://nuxt.com/docs/4.x/api/components/nuxt-route-announcer) announces client navigation; the existing skip link targets a focusable main region.                                                                                                                                                                                         |
| Content       | [Selected query fields](https://content.nuxt.com/docs/utils/query-collection#selectfields-keyof-collection) keep raw Markdown out of post payloads. Feeds still query it on the server. Collection schemas and build hooks preserve the existing Markdown syntax.                                                                                                    |
| Code and math | Shiki and KaTeX render at build time. Shiki uses the existing light/dark themes and selected languages; KaTeX retains HTML plus accessible MathML and its untrusted-input defaults.                                                                                                                                                                                  |
| Diagrams      | Mermaid is imported only when a diagram component mounts, after hydration and font loading. It uses the existing neutral theme, Dagre layout, strict input handling, and a visible error fallback.                                                                                                                                                                   |
| Images        | [Static IPX](https://image.nuxt.com/advanced/static-images) emits optimised images alongside the pages. Post heroes have dimensions and high-priority preload hints; below-the-fold card images remain lazy. Existing WebP and 1x/2x densities are retained.                                                                                                         |
| Sitemap       | [Zero runtime](https://nuxtseo.com/docs/sitemap/guides/zero-runtime) produces static XML. Last-modified dates reflect content dates, not rebuild times; unnecessary priorities and change frequencies are omitted. Submit the sitemap once in Search Console/Bing Webmaster Tools; `robots.txt` advertises it. Deprecated Google/Bing ping endpoints are not called. |
| Offline       | Full-blog precaching is intentionally retained despite the first-visit download. Trailing-slash page URLs, versioned Nuxt payloads, and successful worker activation are checked by Playwright. Third-party embeds are not available offline.                                                                                                                        |
| Hosting       | GitHub Pages runs no Nitro server. Runtime response headers, CSP, compression and CDN cache policy must be enforced at Cloudflare/hosting, not by server middleware or Nitro route-rule headers. Do not enable ISR/SWR, runtime OAuth callbacks or first-party analytics proxies without changing hosting.                                                           |
| Tooling       | `nuxt typecheck` checks Vue templates as well as TypeScript. Production client source maps stay disabled. Draft PRs skip Build and CodeQL jobs to conserve Actions minutes; `ready_for_review` runs both.                                                                                                                                                            |

### Deliberate exclusions and remaining migration work

Keep the current automatically embedded YouTube players, without a cookie consent
banner. Do not replace the existing search with Content's full-text search,
switch to Nuxt 5 compatibility, enable script-free routes (which would break
interactive features), or add experimental islands merely to enable more options.
The font is already self-hosted, so an additional font module is not necessary.

GitHub comments, GA4 through Nuxt Scripts, responsive typography, and the approved
SEO corrections remain part of the migration. Analytics needs a GA4 measurement ID
and a separately agreed storage/consent policy; the absence of a banner does not
itself make cookie-based analytics consent-free. AI-readable Markdown/`llms.txt`,
new social-image generators, and a change to offline/update UX are separate
decisions rather than automatic module additions.
