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
| Images        | [Static IPX](https://image.nuxt.com/advanced/static-images) emits optimised images alongside the pages. Post heroes have dimensions and high-priority preload hints; cards reserve their image height, prioritize the first post image and keep later images lazy. Existing WebP and 1x/2x densities are retained.                                                   |
| Sitemap       | [Zero runtime](https://nuxtseo.com/docs/sitemap/guides/zero-runtime) produces static XML. Last-modified dates reflect content dates, not rebuild times; unnecessary priorities and change frequencies are omitted. Submit the sitemap once in Search Console/Bing Webmaster Tools; `robots.txt` advertises it. Deprecated Google/Bing ping endpoints are not called. |
| Offline       | Full-blog precaching is intentionally retained despite the first-visit download. Trailing-slash page URLs, versioned Nuxt payloads, and successful worker activation are checked by Playwright. Third-party embeds are not available offline.                                                                                                                        |
| Hosting       | GitHub Pages runs no Nitro server. Runtime response headers, CSP, compression and CDN cache policy must be enforced at Cloudflare/hosting, not by server middleware or Nitro route-rule headers. Do not enable ISR/SWR, runtime OAuth callbacks or first-party analytics proxies without changing hosting.                                                           |
| Tooling       | `nuxt typecheck` checks Vue templates as well as TypeScript. Production client source maps stay disabled. Draft PRs skip Build, CodeQL and automatic image compression to conserve Actions minutes; `ready_for_review` runs them.                                                                                                                                    |

JavaScript-only buttons remain disabled until hydration completes, so early clicks
are not lost. Native submit buttons remain available before hydration.

### Comments and analytics

GitHub Issues remain the comment store. The build includes sanitized, read-only
snapshots, then lazily refreshes comments in the browser without a rebuild.
Browser snapshots expire after five minutes; build snapshots after one hour.
Failed refreshes retain saved comments with an explicit message. Writing comments
and adding reactions still happens on GitHub, with no OAuth secret in the site.
An optional build-only `GITHUB_TOKEN` avoids anonymous API rate limits; the Actions
workflow supplies its read-only token to installation and generation.

GA4 loads through Nuxt Scripts with its default cookie storage and **no consent
banner**, as explicitly chosen for this migration. That choice is not a legal
compliance assurance. Set repository Actions variable `GA4_MEASUREMENT_ID` to the
real `G-...` measurement ID before deployment, or set
`NUXT_PUBLIC_GOOGLE_ANALYTICS_ID` locally **before building**. Invalid IDs fail
configuration; an absent ID explicitly disables the external tracker. No ID is
hardcoded, and Universal Analytics has been removed. Enable GA4 enhanced-measurement
page views for browser-history changes; no second manual SPA page-view hook is added.

### Typography and SEO

Native `clamp()` replaces the fluid SCSS mixin while keeping the existing
16–20px root typography and spacing endpoints. Responsive type remains relative
to the user's default font size. Pagination has self-referencing canonicals;
Article and Person schemas, modified dates, large Twitter cards and the Apple icon
are corrected. Drafts remain routable for parity but receive `noindex, follow`;
drafts and streaming tools are omitted from the sitemap.

### Comparison and deployment

`npm start` serves the exact `dist` output, including the real custom 404 status.
`PORT` overrides the default 8080. To compare with production:

```sh
npm run parity:snapshot -- --base https://rehansaeed.com --out .parity/live
npm run parity:snapshot -- --base http://localhost:8080 --out .parity/local
npm run parity:verify -- .parity/live .parity/local
```

The verifier checks all 408 reference pages, heads, page headings, cards, feeds,
sitemap, manifest and other static artifacts against explicit approved changes.
SSR comment headings are not primary page headings. For local visual comparison,
capture the live baselines with `BASE_URL=https://rehansaeed.com` and
`npm run test:visual -- --update-snapshots=all`, then run `npm run test:visual` locally.
Both captures eagerly load images, render content-visibility regions and omit
volatile comments/webmentions; behavioral tests cover those integrations. The
reference applies the approved `clamp()` strategy, including smoothing the old
spacing breakpoint jump, and masks About badges with different image encoding.
Page geometry must remain within two pixels before identical PNG canvases are compared.
Screenshots and reports remain local and gitignored.

`npm run parity:sw-cutover -- <archived-Gridsome-dist>` tests the original worker
at the same origin, waits for actual controller takeover, checks old-cache cleanup
and opens an unvisited post offline. Use a copy of the original release output,
not a fabricated legacy worker.

Before merging, switch repository **Settings → Pages → Source** to **GitHub Actions**.
The workflow builds and tests before uploading `dist`; deployment runs only
outside PRs. Keep the custom domain and Cloudflare configuration. The migration
does not automatically change hosting settings or activate GA4 without its ID.
The original unchecked-in CSS work was not available in this worktree and remains
deferred; the retained SCSS structure supports adding it later.

### Deliberate exclusions

Keep the current automatically embedded YouTube players, without a cookie consent
banner. Do not replace the existing search with Content's full-text search,
switch to Nuxt 5 compatibility, enable script-free routes (which would break
interactive features), or add experimental islands merely to enable more options.
The font is already self-hosted, so an additional font module is not necessary.

AI-readable Markdown/`llms.txt`, new social-image generators, and a change to offline/update UX are separate
decisions rather than automatic module additions.
