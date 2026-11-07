# View-transition trial: lifecycle gate rejected

Assessed **2026-11-07**, against baseline commit
`a0aaf76403e35ed0741591d7a36705e651451e13`, Nuxt **4.6.4**, Vue **3.5.45**
and Nuxt Content **3.16.2**.

**Recommendation: retain the existing navigation.** The approved card-to-article
trial fails its lifecycle gate before shared-hero styling: Nuxt captures the
destination while it is still at the listing's deep scroll position. Scrolling
then occurs during and after the transition. This was reproduced with production
client bundles in Chrome, Edge and Firefox, including warmed navigation and a
controlled delayed Content response. A loaded image does not solve the problem.

No view-transition configuration, shared image names, additional route/image
waiting, router overrides or dependencies remain in the application. This report
preserves the rejected experiment for review; it does not enable animations.

## Experiment and reproduction

The reversible local diagnostic enabled Nuxt's experimental plugin, kept its
global default off, and enabled destination metadata on the article page:

```ts
// nuxt.config.ts: temporary additions, not retained
app: {
  viewTransition: false,
},
experimental: {
  viewTransition: true,
},
```

```ts
// app/pages/[...slug].vue: temporary addition, not retained
definePageMeta({ viewTransition: true });
```

The article metadata is a diagnostic destination gate, not a shippable
origin/destination eligibility policy. No shared-hero CSS was added.

At a 1280x900 viewport, start at `/`, scroll to the listing card for
`/live-streaming-dotnet/`, focus its title link and activate it with Enter.
Instrument `document.startViewTransition` without delaying its update callback;
record `updateCallbackDone`, `ready`, `finished`, scroll position and the
destination `.post__photo` rectangle/readiness. The probe's `update-done` sample
was taken immediately after awaiting the original update callback. Compare
ordinary navigation with the API replaced by `undefined` and with
`prefers-reduced-motion: reduce`.

For cold Content, use a fresh browser context and intercept the actual
`/__nuxt_content/posts/sql_dump.txt*` request. Buffer its original response and
release a test-only gate 800 ms after link activation. Assert that the request
was intercepted; delaying an article `_payload.json` is not an equivalent test
for this application's client Content query.

Repeat the native case after going back to the listing and checking restoration
within 2 CSS pixels of the original scroll position. No animation-duration sleeps,
route wait workaround or application image-decoding wait was used. The source
card image was explicitly decoded in the test before activation to remove that
variable; the destination image was observed, not awaited by the app.

## Observed geometry and controls

Representative native measurements from one run per browser:

| Browser actually run  | Listing scroll Y | Hero top at `ready` | Hero loaded at `ready` | Scroll Y at `finished` |
| --------------------- | ---------------: | ------------------: | ---------------------- | ---------------------: |
| Chrome 137.0.7151.120 |             3545 |            -3137.98 | Yes                    |                   2199 |
| Edge 157.0.4341.42    |             3545 |            -3137.98 | Yes                    |                   2073 |
| Firefox 159.0         |          3547.08 |            -3139.93 | Yes                    |                 706.02 |

The entire hero was above the viewport at `ready`. All three eventually reached
scroll Y 0, with hero top approximately 407 CSS pixels. These are diagnostic
samples, not performance benchmarks or proof about every installed browser.

- Native, warm-native and delayed-Content cases all captured at the stale deep
  scroll position in all three browsers.
- One warmed Chrome capture also observed an image that was not yet ready.
  Development Chrome independently reproduced an offscreen, unready destination
  image. Image readiness is therefore another risk, not the sole cause.
- All three browsers restored listing history scroll within the asserted
  tolerance before the warmed repeat.
- Unsupported-API and reduced-motion controls started zero native transitions
  and reached the correct article, top scroll position and polite route-title
  announcement. Native cases started exactly one.
- Enter activation worked, but focus ended on `BODY`, including the unsupported
  and reduced-motion controls. Do not attribute this existing navigation focus
  outcome solely to native transitions or call it a verified screen-reader
  experience.

The probe made a conditional attempt to check an article section anchor. It did
not persist evidence that the selector matched, so anchor exclusion is **not
claimed as verified**.

## Why styling cannot fix this gate

Nuxt's installed plugin releases the router in the native update callback and
resolves that callback on `page:finish`. The page suspense sequence emits
`page:finish` before `page:loading:end`; the default router scroll waits for the
latter and an animation frame. Root smooth scrolling then extends movement past
the snapshot. The runtime geometry agrees with this ordering.

Adding a shared hero name would pair a visible card with an offscreen destination.
Changing only the duration or waiting for image decoding does not establish the
correct destination rectangle. Moving scrolling into private Nuxt lifecycle state,
holding navigation for images or rewriting the router exceeds the approved trial.
Restricting the feature to a convenient first card would hide the deep-scroll
failure rather than satisfy the requirement.

Reconsider only after a supported Nuxt integration coordinates destination scroll
with capture, or after separate approval for a custom lifecycle approach. Before
styling, require visible, correctly positioned destination capture across cold,
warm and delayed routes without new route/image waits. Keep article-to-article,
pagination/filter, theme and cross-document transitions out of this decision.

## Validation limits and preserved evidence

The production diagnostic was **not a successful deployment build**.
`npm run build` exited 1 after an OG-image HTTP 408 render timeout at
`/_og/s/o_d496663cdf0a5cd8.png`. Artifact and SEO verification did not run.
No baseline rebuild established whether that failure was unrelated.

For this diagnostic only, completed prerendered HTML/images were served with the
exact generated production client bundles copied from
`node_modules/.cache/nuxt/.nuxt/dist/client` into the incomplete `dist`.
This output must not be deployed. The preview had missing font, icon and
build-manifest resources, PWA registration warnings and SQLite WASM MIME fallback.
The probe recorded these rather than treating the preview as clean. Assertions
found no uncaught page errors in the completed cases; console warnings/errors
remain a limitation, especially for visual fidelity and timing.

The session's `files` directory preserves:

- `view-transitions-investigation.md`: initial sources, alternatives and approved
  lifecycle stop condition.
- `view-transitions-lifecycle.cjs` and `.json`: development probe and measurements.
- `view-transitions-static-trial.cjs` and `view-transitions-static-results.json`:
  production-bundle probe and all 15 native/warm/control result records.
- `trial-baseline-listing.png`, `trial-baseline-article.png`,
  `static-trial-article.png` and `view-transitions-static-trial.webm`: actual
  diagnostic captures. The final screenshot is not evidence of a successful
  shared-hero animation; no such animation was implemented.

The browser script exited 0 for its navigation, bypass, history, request-delay and
uncaught-error assertions. **The feature acceptance gate failed**; script success
must not be reported as approval to ship.

Full application type checking, linting and existing Playwright regression suites
were not rerun after rejecting the experiment: the final repository change is
this report only. Rapid superseding navigation, route errors, broken/delayed
destination images, modified clicks, forward restoration, Safari, dark-mode
motion, Windows Narrator, forced colours, 200% zoom/display scaling and low-power
performance remain unverified. Those acceptance checks were not pursued after the
earlier lifecycle gate failed. No accessibility support or merge readiness is
claimed.

## Primary sources

Retrieved **2026-11-07**; Nuxt links are version-pinned:

- [Nuxt transitions guide](https://nuxt.com/docs/4.x/getting-started/transitions):
  experimental integration and asynchronous setup limitations.
- [Nuxt 4.6.4 native transition plugin](https://github.com/nuxt/nuxt/blob/v4.6.4/packages/nuxt/src/app/plugins/view-transitions.client.ts):
  destination metadata, motion bypass and `page:finish` completion.
- [Nuxt 4.6.4 page lifecycle](https://github.com/nuxt/nuxt/blob/v4.6.4/packages/nuxt/src/pages/runtime/page.ts):
  suspense resolution and loading hooks.
- [Nuxt 4.6.4 scroll behaviour](https://github.com/nuxt/nuxt/blob/v4.6.4/packages/nuxt/src/pages/runtime/router.options.ts):
  saved positions, loading completion and deferred scrolling.
- [MDN: Using the View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using):
  capture lifecycle and progressive enhancement.
- [Vue Router scroll behaviour](https://router.vuejs.org/guide/advanced/scroll-behavior.html):
  history restoration and asynchronous scrolling.
