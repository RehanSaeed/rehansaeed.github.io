# Contributing

All contributions, however small, are valued!

## Pull requests

Open a pull request directly; you do not need to raise an issue or get approval
before contributing. Keep changes focused and explain what changed and why.
Link an existing issue if it provides useful context, but an issue is not required.

## Coding guidelines

- Follow [`.editorconfig`](../.editorconfig) and the existing code conventions.
- Use ESLint for linting and Prettier for formatting.
- Add tests for behavior changes and make sure checks pass.

## Images

Keep PNG originals for images with transparency and JPG originals for photographs;
use `.jpg`, not `.jpeg`. After adding or changing an image in `public/` or
`content/`, run `npm run images:avif` and commit the generated `.avif` companions
alongside the originals (for example, `photo.jpg` becomes `photo.avif`).
When PNG and JPG originals share a basename, generate one shared AVIF from the
PNG and retain both originals for authoring and compatibility. These quality-60
AVIF files are lossy delivery sources, not archival masters. The command preserves
the chosen source's dimensions and transparency, auto-orients photos and strips metadata.

Use Nuxt Image's `NuxtImg` for responsive images, with `format="avif"` and an
AVIF source. The content pipeline normalises Markdown image sources and collection
`heroImage` values to AVIF once; rendering components and search results consume
those URLs directly. Computed `heroImageOriginal` retains the authoring URL for
feeds, social cards, structured metadata and sitemap images. Markdown image links
and raw feed bodies also retain their original URLs.

Use native `<img>` elements for runtime search results so their pre-generated
AVIF files work on static hosting without a runtime image server. Only surfaces
with arbitrary runtime input (avatars and thumbnail query parameters) need
`getAvifSource(src) ?? src`. Normal local PNG/JPG content is
delivered as AVIF only: browsers without AVIF support have no raster fallback.
Keep SVGs and remote images in their original formats, and retain PNG/JPG URLs in feeds, social metadata,
favicons and the web app manifest for compatibility. Originals remain deployed
where feeds, image links and compatibility consumers can require them; they are
not precached as content fallbacks. Only PNG installation assets (favicons,
app icons and manifest screenshots) are precached alongside AVIF content.

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
