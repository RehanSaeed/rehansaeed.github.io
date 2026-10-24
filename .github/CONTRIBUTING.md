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

## Release verification

Verify downloaded GitHub Pages artifacts rather than substituting a local build
when signing off a production release. Both service-worker checks accept the
current artifact as their optional final argument (default: `dist`):

```powershell
npm run parity:sw-cutover -- .parity\gridsome-release .parity\current-release
npm run parity:update-cycle -- .parity\previous-release .parity\current-release
```

The cutover check uses the actual legacy worker, rejects unapproved activation,
waits for natural takeover and old-cache cleanup, and checks every published
article offline. The update-cycle check requires distinct real Nuxt builds and
byte-identical retained assets. It checks Later, an explicitly approved single
reload, cross-tab deferral, offline navigation and explicit update failures.

For GA4, enable **Enhanced measurement > Page views > Advanced settings > Page
changes based on browser history events** on the web stream. Verify one
`page_view` per client-side navigation, including browser Back; do not add a
second manual page-view hook alongside history-based tracking.

The public sitemap is `https://rehansaeed.com/sitemap.xml`. Submit it in the
verified Google Search Console and Bing Webmaster Tools properties using an
authenticated browser. A reachable sitemap or `robots.txt` declaration is not
evidence that an authenticated submission succeeded.
