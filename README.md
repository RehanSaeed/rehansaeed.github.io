![Muhammad Rehan Saeed](./public/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg)

[![Website Status](https://img.shields.io/website?url=https%3A%2F%2Frehansaeed.com)](https://rehansaeed.com) [![GitHub Actions Status](https://github.com/RehanSaeed/rehansaeed.github.io/workflows/Build/badge.svg?branch=main)](https://github.com/RehanSaeed/rehansaeed.github.io/actions)

[![GitHub Actions Build History](https://buildstats.info/github/chart/RehanSaeed/rehansaeed.github.io?branch=main&includeBuildsFromPullRequest=false)](https://github.com/RehanSaeed/rehansaeed.github.io/actions)

# 🚨 Forking this Repository (Please Read!)

If you want to use this code for your own blog, you can do so but with proper attribution. I spent a non-trivial amount of effort building and designing this iteration of my website, and I am proud of it! All I ask of you all is to not claim this effort as your own.

## Development

Use Node.js 24.15 or later in the 24.x LTS line, or Node.js 26+. Run `npm ci`, then `npm run dev`. Before pushing, run
`npm run build`, `npm run typecheck`, `npm run lint`, and `npm test`. The build prerenders the site
into `dist`; `npm start` serves that exact artifact. `npm run analyze` writes its
report outside the published directory.

Husky installs the `.husky/pre-commit` hook on installation; it runs lint-staged
with ESLint followed by Prettier for JavaScript, TypeScript and Vue files,
including ESM TypeScript tests. Other supported staged files use Prettier.
`npm run lint:fix` applies ESLint's available fixes. Set `HUSKY=0` when hooks should
not be installed, such as in CI.

Image automation compresses files without using the action's GitHub-API commit
path, then commits through Git so the repository's LFS filters retain image
pointers. It checks those pointers before pushing and never force-pushes.
Bot updates do not trigger another compression pass.

TypeScript stays on `6.0.3`, the latest compatible JavaScript-API release for
`vue-tsc`; TypeScript 7's native compiler is not a drop-in replacement for that
Vue checker. Nuxt Scripts stays on its existing v2 beta channel.
Its beta.16 Nitro cache-driver path is normalized to a file URL on Windows;
Linux configuration is unchanged.

`@nuxt/a11y` runs axe checks in development and exposes results in Nuxt DevTools.
The published `1.0.0-alpha.1` release is development-only by default; it does not
provide build reports or an accessibility CI gate. It is not enabled in production.

`nuxt-link-checker` checks prerendered links during generation and fails the build
on inspection errors. JSON and Markdown reports stay in
`.data/link-checker-report`, outside `dist`. Remote URL fetching is disabled so
third-party outages do not block a build; this also means absolute same-origin
URLs are not checked for reachability by that module. The existing artifact
validator still checks maintained navigation and assets. Only the fictional
`why-x-is-better-than-y` URL in the pull-request etiquette post is excluded from
link inspections; the article and its other links are still checked.
Warning-only findings remain visible rather than being suppressed or
automatically applied to historical articles. These include absolute internal
URLs and source-level checks of disabled pagination, Cloudflare email links and
labelled heading permalinks.

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
The Nuxt SEO suite owns Robots, Sitemap, Schema.org, SEO Utils, Link Checker,
AI Ready and Skew Protection. OG Image uses Takumi to prerender branded
1200x630 PNG cards with the existing hero, title and author. There is no
production image-rendering server or external rendering service.
Schema.org provides one graph per page: shared Person, Organization and WebSite
identities, Article dates/original hero dimensions, breadcrumbs, ProfilePage and
ordered collection ItemLists. Canonicals deliberately discard search parameters.
Schema generation is server/build-only, following the module's production
default; every prerendered crawler response has its own graph without shipping
the schema resolver to readers.
Drafts remain routable for parity but receive `noindex, follow`; drafts,
streaming tools and error pages are excluded from sitemap/AI discovery.

Public pages have static Markdown alternatives, `llms.txt`, `llms-full.txt`
and `sitemap.md`. AI input, search and **AI training are explicitly allowed**.
These crawler policies express preferences, not access controls or guarantees
that crawlers comply. Markdown is converted from rendered HTML to preserve
the custom Markdown/snippet pipeline. Request-header negotiation and an AI
database/server are disabled: GitHub Pages cannot run their middleware.
The build filters unlisted entries out of AI Ready's metadata-based Markdown
sitemap as well as excluding their Markdown files and full-content exports.
`npm run seo:verify` checks every public page's canonical, graph, social-card
file/dimensions, Markdown canonical/discovery/full export, and noindex exclusions.

The service worker and deployment-version detector share one accessible
**Update now / Later** notice. Later neither activates the waiting worker nor
reloads the reader; activation in another tab also does not force a reload.
Update now activates the installed worker and reloads once. Previous hashed
assets are bundled into subsequent static output for up to 30 days/10 versions;
the Actions cache preserves them between main builds. The full blog remains
precached; social-only cards are excluded. Cloudflare must not serve stale
HTML, `service-worker.js`, `manifest.webmanifest` or `_nuxt/builds/latest.json`.

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
at the same origin, verifies the new worker waits while a legacy tab is open,
closes that last legacy tab, checks takeover/old-cache cleanup, and opens an
unvisited post offline. The old Gridsome UI cannot show the new notice; its first
migration activates naturally once its last tab closes. Subsequent Nuxt updates
use the shared notice. Use original release output, not a fabricated worker.

For a real two-build update check, copy a successful `dist` into an ignored
directory, build a second version, then run
`npm run parity:update-cycle -- <previous-Nuxt-dist>`. This checks both signals,
Later, single approved reload, cross-tab deferral, unavailable-worker fallback,
offline navigation and byte-identical retained JS/CSS from the previous build.

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

### Module decisions and deliberate exclusions

Keep the current automatically embedded YouTube players, without a cookie consent
banner. Do not replace the existing search with Content's full-text search,
switch to Nuxt 5 compatibility, enable script-free routes (which would break
interactive features), or add experimental islands merely to enable more options.
Nuxt Fonts resolves the existing Fontsource Audiowide Latin 400 package locally,
retaining the identical 14,132-byte WOFF2 and one preload. Its generated
metric-adjusted system-font fallbacks reduce heading reflow while the font loads;
the manual app-level preload and Fontsource CSS import are removed. Only
`--font-heading` is processed: body, serif and monospace stacks are unchanged.
The unused WOFF fallback is no longer shipped. In a controlled Chromium cold-font
experiment (375px/1280px viewports, home/post/about, font delivery held until after
fallback layout, hydration disabled and the Audiowide `local()` shortcut removed),
the mobile home font-swap CLS fell from about 0.072 to 0.0011 and the post from
0.044 to 0.00066. These are isolated laboratory swaps, not production Core Web
Vitals or a guaranteed LCP improvement; final loaded heading geometry matched.

Nuxt ESLint provides the generated Nuxt/Vue/TypeScript flat configuration.
CI runs `npm run lint` with zero warnings. Prettier remains the formatter;
configuration preserves established Vue naming/ordering and optional-prop
conventions, permits Vue 3 fragments and scopes Playwright fixture conventions to
tests. Intentional HTML-rendering sinks have local, explained rule exceptions.
Type checking still uses TypeScript 6's JavaScript compiler API through `vue-tsc`;
Vue Language Tools' draft v4/TypeScript 7.1 content-mapper work has no stable ETA.

Nuxt Icon is not added solely for performance: the existing inline SVGs already
avoid external requests. The visual comparison retains all 25 originals and
adds 27 stock alternatives for the non-exact/custom rows, including multiple
choices where appropriate. Generic account symbols are not substitutes for the
personal logo's branding. Moving to an icon module is still a separate decision.

Color Mode is also not installed without approval. It can replace the custom
bootstrap, globals/listeners and most theme-button state. Those sections currently
contain 76 nonblank lines in total; an estimated 40-60 net handwritten lines could
go after adding module configuration and hydration guards, while retaining
analytics and `data-theme` CSS. This is a scoped estimate, not an implemented diff.
Its benefits are maintained storage/system-preference handling, reactive
consumers, forced page modes and hydration helpers, not a demonstrated speed
improvement: both approaches still require an early inline script.
There is an important behavior choice: today an OS theme change overrides and
rewrites an explicit saved choice; Color Mode normally keeps explicit light/dark
preferences until the user selects system mode. Preserving the old override
behavior would retain custom code and reduce the maintenance saving.

`nuxt-security` is deliberately omitted for this GitHub Pages deployment:
Cloudflare owns the HTTP security headers, and Pages cannot run Nitro middleware.
Static CSP/hash tooling can be useful on other deployments, but cannot relax an
existing Cloudflare HTTP policy.

### Documentation audit and release checklist

The audit read 239 Nuxt pages and 250 SEO-suite pages, with per-URL ledgers retained
in the session's `seo-doc-audit` artifacts. Module coverage additionally includes
Content (40), Image (51), Fonts (5), Color Mode (8), Scripts (50, including older
documented examples), the three ESLint package guides, the installed A11y alpha's
README, and Nuxt-relevant Vite PWA guides. Content/Image/Fonts findings survive
as module-level summaries, not a complete per-page decision ledger. A11y's main
branch describes features absent from the installed alpha; those are not claimed
as shipped. Non-Nuxt PWA framework tutorials are out of scope.

Source inspection and generated-output checks take precedence over generic
recommendations: Skew Protection really does restore old files into static
output; Content's external portfolio URLs are not internal sitemap entries; and
schema graphs are explicitly built rather than pretending unused frontmatter
fields are implemented. Safe Nuxt improvements include native search-result
announcements, NuxtLink external-link handling and tagged module diagnostics.
Experimental WebMCP/islands, server-only MCP/IndexNow infrastructure, alternate
renderers, extra social-card formats and cosmetic navigation transitions are
not automatically enabled. Comments/webmentions retain their immediate client
refresh rather than silently adopting lazy hydration.

Remaining release work, excluding manual code review:

1. Finish exact-head build, type, lint, browser, visual, 408-route parity and
   real-worker/two-build checks; require the GitHub build to pass.
2. Decide whether the unavailable original CSS work is deferred or must be
   supplied before release; decide separately whether to migrate icons/Color Mode.
3. Approve the Pages source cutover, retain the recorded legacy rollback revision,
   and preserve the custom domain/DNS. Merge/deploy only when authorized.
4. Verify Cloudflare freshness for HTML/worker/manifest/latest-build metadata and
   the enforced GA4-compatible CSP; purge stale release assets when necessary.
5. Smoke-test the deployed revision, real 404, generated social previews,
   public Markdown/robots/schema, immediate comments/search, both update choices,
   legacy installed-client migration and full-blog offline behavior.
6. Check GA4 collection/DebugView and client-side navigation pageviews with
   `G-78Z8H7ZLS9`; the approved default remains cookies without a consent banner.
7. Run securityheaders.io after deployment and verify the intended headers at
   the public origin. Submit/inspect the sitemap in Google Search Console and
   Bing Webmaster Tools, and check representative rich results/social previews.
