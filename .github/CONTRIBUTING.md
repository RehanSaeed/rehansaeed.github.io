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
and package IDs in `content/portfolio/`. The shared totals on Portfolio and About
include only published open source entries, counting each repository and package
once (case-insensitively). Add projects and packages to those entries rather than
editing the displayed totals.

Counts are cached for an hour. When a source is unavailable, an existing snapshot
is retained with a build warning; without a saved count the build fails rather
than displaying a fabricated zero. The displayed date identifies the build
snapshot, not necessarily when every source was last contacted. The Build workflow
rebuilds and deploys the site every Monday at 05:17 UTC, as well as on pushes to
`main` and manual runs, so published figures refresh without content edits.

Portfolio's counters are estimates based on lifetime averages, not live API
counts. For each package, divide its lifetime downloads by the seconds between
the earliest available version's creation date and the observation; add these
individual rates together. NuGet's `FindPackagesById()` request orders by
`Created asc` with `$top=1` and `semVerLevel=2.0.0`. Stars use the same calculation
per repository with GitHub's `created_at`. This works on the first observation
and does not mistake an unchanged hourly snapshot for a zero lifetime rate.
Lifetime averages do not predict recent trends, and star totals can fall.

The lifetime calculation needs no historical snapshots or cross-build CI cache.
The existing short-lived local cache contains only the latest API responses.
Missing creation dates, invalid ages and source failures disable the affected rate
rather than inventing one. Portfolio does not start an estimate from a snapshot
older than 14 days.

The shared `app/components/shared/number-ticker.vue` owns the title, odometer and
animation. Use it anywhere without importing portfolio data:

```vue
<u-number-ticker title="Downloads" :number="1000" :rate="2.5" />
```

`rate` is the average increment per second. Each second uses a random multiplier
between 0.5 and 1.5, retaining fractional increments so slow-growing counts do not
artificially increase every second. The optional `paused` prop stops animation;
`locale` defaults to `en-GB`. Changing `number` or `rate` resets the counter.
Reduced-motion users see the supplied number. Hidden tabs suspend timers and
catch up at the average rate on return; unmounting cleans up timers and listeners.
Screen readers receive the supplied number without per-second announcements.
Portfolio keeps verified totals, the estimate explanation and a shared pause
control outside its two side-by-side cards.

Six reviewable title-and-number layout studies are in
`tests/fixtures/oss-card-treatments.html`. Open the file directly to compare light,
dark and narrow layouts; it is not published as part of the site.

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
