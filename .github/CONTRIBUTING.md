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

### Semantic HTML

Use native HTML elements for navigation, actions, search, article sections and
collections. Keep `div` and `span` for neutral layout wrappers, rather than adding
sectioning elements without a meaningful section. Use labelled landmarks and
headings that reflect the content hierarchy, not the desired font size.
Cards default to a neutral wrapper; set `tag="article"` or `tag="section"`
explicitly when the content warrants it.

Unstyled UI lists use `ul` or `ol` with `li` children. The `list-unstyled` class
applies their shared reset without an explicit role, leaving article list
typography unchanged. Lists with `role="list"` also receive this reset; that role
retains unstyled list semantics in Safari where needed.
The Markdown pipeline nests article headings below the page title
while preserving their fragment IDs and visual sizes. Run
`npm run test:chrome -- semantic-html.spec.ts card-sizing.spec.ts` after
`npm run build` when changing these structures.

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
