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

Image dimensions are read from the source files at build time, not inferred from
their names; the same metadata supplies rendering, Open Graph and ImageObject
dimensions. Heroes, cards and Markdown images use responsive width candidates
covering the fluid column at 1x/2x density. Markdown images reserve their intrinsic
ratio before downloading and use native lazy loading; hero/LCP images remain
eager and high priority. Dimension changes invalidate the parsed-content cache.
The regression suite checks all 178 Markdown images across 42 posts, delayed
downloads, distant lazy images, incorrect hero filenames and wide/retina layouts.

Dialogs have hydration-stable, unique heading IDs and title-specific close labels.
Literal currency dollars in Markdown must be escaped as `\$` so they cannot be
mistaken for math delimiters; genuine KaTeX math remains enabled.
Markdown soft breaks retain spaces between inline elements without changing code
or explicit hard breaks. Initial dates use UTC on both server and browser, then
switch to relative/local dates after mounting. Footer, cards and search use
distinct IDs; colliding page-title IDs are renamed without changing Markdown
fragment targets.

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

The production **Cloudflare response-header CSP must also be updated**; a Pages
artifact cannot override an HTTP policy with a meta tag or `_headers` file.
Preserve the existing first-party, GitHub, webmention, font and YouTube rules.
For GA4 without Ads features, add the following sources to the effective
directives, following [Google's CSP guidance](https://developers.google.com/tag-platform/security/guides/csp):

| Directive                                              | Additional sources                                                                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `script-src` (and `script-src-elem` if separately set) | `https://www.googletagmanager.com`                                                                                     |
| `connect-src`                                          | `https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com`                                 |
| `img-src`                                              | `https://www.googletagmanager.com https://*.google-analytics.com` (already covered by the current `https:` image rule) |

Do not enable `unsafe-eval`, add a static nonce, or replace the policy with `*`.
The deployment preflight checks the enforced HTTP and meta policies, including
regional collectors, when an ID is configured. Tests stub vendor/collection
requests; real cookie storage and collection still require production verification
with the real measurement ID.

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

`npm run build` also validates every reference route, unique HTML IDs and local
assets/maintained navigation paths case-sensitively. Outbound Markdown examples
and reader-authored comment links are not deployment assets. The artifact must have the correct `CNAME`,
required feeds/worker/404, no links/private build files, and stay below the Pages
1 GB limit. It writes `dist/deployment.json` with the build revision and critical
HTML/asset checks for the post-deployment smoke check. Hidden public files such as
`.well-known/security.txt` are included in the Pages upload.

#### Safe cutover and rollback

The inspected production configuration still publishes **`release` at `/`**.
Merging alone is **not** a completed cutover. Neither the build nor its preflight
changes Pages settings, DNS, the custom domain or Cloudflare.

1. Finish local validation and the ready-for-review CI run before merging.
   Preserve the current `release` branch and record its deployed commit
   (`92e2ca92bf6deb684a4e8101045f6c6659a6b5d2` at the October 2026 inspection).
   Keep the archived legacy output for the worker-cutover check.
2. If configuring GA4, update the Cloudflare CSP above and supply the measurement
   ID. Otherwise tracking remains explicitly disabled, without blocking the site.
3. At the approved cutover, switch **Settings → Pages → Source** to
   **GitHub Actions**, retaining `rehansaeed.com` and the existing DNS/proxy
   configuration. Do not delete/recreate the Pages site or change its domain.
   Run `npm run pages:preflight` with a read-only `GITHUB_TOKEN` and the same
   analytics-ID environment used for the build; wrong source/domain/CSP or an
   unhealthy HTTPS response fails explicitly.
4. Merge. Only `main` can upload/deploy, including manual dispatches; PRs and
   feature-branch dispatches cannot publish. Build, typecheck, tests and hosting
   preflight must all succeed before upload. A failed build/preflight never
   invokes deployment or replaces the published artifact. Deployments are not
   cancelled mid-publication.
5. The workflow downloads the exact uploaded artifact's verification marker,
   deploys, then checks the custom-domain revision, critical HTML, hashed JS/CSS,
   feeds, manifest/worker and real 404 status, retrying propagation for two minutes.
   HTML checks allow unrelated CDN-injected markup; asset bytes must match.
   If Cloudflare still serves old files, purge the affected cache and rerun
   `npm run pages:verify`. Verify search, comments, GA4 DebugView and the installed
   legacy worker in a browser too. Webmention failure is separately warned and
   does not misreport a verified website deployment as failed.
6. If cutover or the deployed site is unhealthy, restore Pages Source to
   **Deploy from a branch → `release` → `/`**, keeping the domain/DNS unchanged;
   verify the legacy site's return. No automatic rollback deletes a deployment,
   rewrites `release`, or changes hosting. Later rollback can redeploy a known-good
   Actions artifact. Review/purge Cloudflare caches and check worker recovery:
   rolling back HTML alone is not a guarantee that every installed client has
   reverted.

Source switching and an actual production deployment are still manual/external
operations; local checks cannot guarantee zero downtime or substitute for the
first successful Pages deployment and public smoke check.
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
