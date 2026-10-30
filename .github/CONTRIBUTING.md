# Contributing

All contributions, however small, are valued!

## Pull requests

Open a pull request directly; you do not need to raise an issue or get approval
before contributing. Keep changes focused and explain what changed and why.
Link an existing issue if it provides useful context, but an issue is not required.

## Coding guidelines

- Follow [`.editorconfig`](../.editorconfig) and the existing code conventions.
- Use ESLint for linting and Prettier for formatting.
- The pre-commit hook formats staged Markdown, JSON and stylesheet files with
  Prettier, and runs ESLint fixes and Prettier on staged JavaScript, TypeScript
  and Vue files.
- Add tests for behavior changes and make sure checks pass.
- CI rejects flaky Playwright tests even if a retry passes. Use
  `npx playwright test <test-file> --repeat-each=10 --retries=0` to investigate
  suspected timing or rendering issues without retries hiding failures.

## Portfolio statistics

The build fetches GitHub stars and lifetime NuGet download counts for the projects
and package IDs in `content/portfolio/`. The totals on Portfolio
include only published open source entries, counting each repository and package
once (case-insensitively). Add projects and packages to those entries rather than
editing the displayed totals.

Counts are cached locally for an hour and refreshed by the weekly Monday 05:17 UTC
build, pushes to `main` and manual builds. Source failures retain saved counts with
a warning; without saved counts the build fails. No observation history or
cross-build CI cache is needed.

Portfolio's download animation uses lifetime averages, not live API counts.
The star animation deliberately averages one increase every 15 seconds for
illustration, not the measured growth rate; the supplied snapshot and accessible
numbers remain exact. Sum each package's downloads divided by its age in seconds.
NuGet's `FindPackagesById()` request obtains the earliest release with `Created asc`,
`$top=1` and `semVerLevel=2.0.0`. Invalid creation dates disable the download rate;
failed or over-14-day-old source snapshots disable the corresponding animation.

The shared `app/components/shared/number-ticker.vue` accepts a title, number and
average rate per second, independently of Portfolio:

```vue
<u-number-ticker title="Downloads" :number="1000" :rate="2.5" />
```

Random pauses and jumps preserve the average and retain fractional increments.
Optional `paused` and `locale` props support other uses; the default locale is
`en-GB`. Reduced-motion users and screen readers receive the supplied number.
Hidden tabs suspend timers and catch up at the average rate on return.
Portfolio displays two title-and-number cards with accessible info buttons using
the shared tooltip component. Their tooltips explain scope, verified counts and
illustrative animation; there is no pause control or explanatory paragraph.
The pair uses the same maximum width and font sizing as compact project cards so
their outer edges align.

About uses the same Portfolio download and star totals and animations, including
listed organisation-hosted projects. The `borderless` option on
`u-portfolio-statistics` shows both titles and tickers without outer card borders
above the Followers, Sponsors and Watchers badges, rather than an account-only
stars badge.

The shared number ticker has an optional `info` slot beside its centred title;
ordinary title/number/rate usage does not require it.

The matching Watchers badge sums `watchers.totalCount` from GitHub GraphQL across
all public repositories owned by the account in `site.json`, including forks and
archived repositories. It paginates beyond 100 repositories and counts watch
subscriptions, not unique people. This build-time total uses the existing
`GITHUB_TOKEN`, a one-hour local cache and the weekly rebuild. Failed requests
retain saved counts with a warning and retry next build; without saved counts the
build fails. Do not use REST's `watchers_count`, which counts stars instead.

## Images

Keep PNG originals for images with transparency and JPG originals for photographs;
use `.jpg`, not `.jpeg`. After adding or changing an image in `public/` or
`content/`, run `npm run images:avif` and commit the generated `.avif` companions
alongside the originals (for example, `photo.jpg` becomes `photo.avif`).
When PNG and JPG originals share a basename, generate one shared AVIF from the
PNG and retain both originals as fallbacks. The command preserves the chosen
source's dimensions and transparency, auto-orients photos and strips metadata.

Use Nuxt Image's `NuxtPicture` for responsive images, with `format="avif"` and
`legacy-format="png"` or `legacy-format="jpg"` matching the original.
Use native `<picture>` elements and `getAvifSource` for images chosen at
runtime (such as search results), so their pre-generated AVIF companions work on
static hosting without a runtime image server. Keep SVGs and remote images in
their original formats, and retain PNG/JPG URLs in feeds, social metadata,
favicons and the web app manifest for compatibility.

The PWA precaches AVIF content images only, including the plain hero companions
used by offline search. PNG/JPG fallbacks remain available online but are not
downloaded during offline installation. PNG app icons and installation screenshots
are retained for compatibility. Browsers without AVIF support cannot display
uncached content images offline.

## Dependency updates

Commit `package.json` and its regenerated `package-lock.json` together. Run
`npm ci`, `npm run build`, `npm run typecheck`, `npm run lint`, and the relevant
Playwright tests before merging an update.

Renovate uses full installs (`skipInstalls: false`) to update the lockfile.
npm's lockfile-only path tries to inspect bundled dependencies, including
`@mdream/rust-wasm32-wasi`, by fetching their resolved tarball URLs. With npm 12's
remote-fetch policy this fails with `EALLOWREMOTE`, even for registry packages.
Full installs avoid that path without enabling arbitrary remote dependencies.
Renovate's default lifecycle-script restrictions remain enabled.

Keep TypeScript on version 6 while `vue-tsc` requires its JavaScript compiler
API. A direct TypeScript 7 upgrade fails resolving `typescript/lib/tsc`; a
regenerated lockfile does not fix this. Remove the version restrictions from
`renovate.json` and `.github/dependabot.yml` only after Vue/Nuxt checking supports
the native compiler and the project's type checking passes. See Microsoft's
[embedded-language compatibility guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#typescript-and-embedded-languages).
