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

## About location map

The About page progressively enhances its static map with
[MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) and
[OpenFreeMap](https://openfreemap.org/) tiles. No account, API token, environment
variable or paid map subscription is required for local development or deployment.
The map uses OpenFreeMap's Positron and Dark styles, with white countries and
water, borders and pins coloured using the site's purple theme tokens. The author
pin marks a representative East London point near Stratford, not a street address.
Its default framing shows the UK and Europe, not street-level London. Keep that
regional view for reduced-motion users as well.
Keep the map's OpenMapTiles and OpenStreetMap attribution visible.

The renderer, worker and styles are loaded only when the map approaches the
viewport. Reduced-motion users start directly at the regional view without the fly-in.
Without JavaScript or WebGL, or if the map service fails, the photo pin and
self-hosted Natural Earth map remain available.

OpenFreeMap's public service currently has no map-view or request limits for
normal use, but is donation-funded and provides no availability guarantee.
Visitors make external requests for styles, tiles, sprites and fonts.
Once the interactive map loads, it also requests an approximate IP location from
[GeoJS](https://www.geojs.io/docs/v1/endpoints/geo/) automatically. GeoJS receives
the visitor's IP address; the request omits credentials and the referrer. No GPS
permission is requested, and the application does not persist coordinates or send
them to analytics. IP locations can be inaccurate, especially with VPNs.
The map adds a second purple pin and a dotted line to London, and widens the
regional view to include both locations, unless the visitor has already moved
the map. Theme changes must restore the connection layer as well as its colours.
The caption calculates an approximate great-circle distance in miles from the
validated IP coordinates; never hardcode a visitor location or an example distance.
GeoJS is linked in the map credits rather than a separate explanatory paragraph.
A failed, invalid or eight-second timed-out lookup shows an accessible notice
without breaking the map. Lookup requests are aborted on navigation and are not made for the static
fallback. Tests must mock GeoJS rather than use real visitor locations.
Retain the fallback and review
[OpenFreeMap's terms](https://openfreemap.org/tos/) when changing the integration.

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
