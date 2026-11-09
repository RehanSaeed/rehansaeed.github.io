# Bounded card-to-article view transitions

Assessed **2026-11-07**, against baseline commit
`a0aaf76403e35ed0741591d7a36705e651451e13`, Nuxt **4.6.4**, Vue **3.5.45**
and Nuxt Content **3.16.2**.

The initial native-integration trial failed its lifecycle gate: Nuxt captures the
destination while it is still at the listing's deep scroll position. Scrolling
then occurs during and after the transition. This was reproduced with production
client bundles in Chrome, Edge and Firefox, including warmed navigation and a
controlled delayed Content response. A loaded image does not solve the problem.

The author subsequently approved **"Implement the custom bounded card-to-article
approach"**. The implementation below replaces the failed native lifecycle rather
than enabling Nuxt's experimental global integration. The original findings are
preserved separately as evidence for that decision.

## Custom lifecycle and scope

### Rendered-origin investigation (2026-11-09)

The author reported that the hero always appeared to animate from the top.
Actual native first/mid/end PNGs were captured with animations explicitly allowed
and paused at 0, 100 and 200 ms. This avoids the earlier shared-browser screenshot
command, which did not preserve intermediate animations.

With the source positioned at y=150, the pixels and computed image group were at
y=150, approximately 348 and 407. With the source at y=650, a physical title click
produced pixels and image-group positions at y=650, approximately 463 and 407:
the image moved upwards from the lower card position. These captures therefore do
not reproduce a fixed page-top origin in standalone Chromium/Edge. They do not
disprove the author's experience in the embedded preview, and no production
animation change is claimed as a fix for that unresolved observation.

Source/listing, first, midpoint and end PNGs are preserved as
`files/origin-150-*.png` and `files/origin-650-*.png` in session storage. The latter
was captured in Edge 157 with its own context and no test-fixture routing.
The owned capture completed, but teardown stalled; its exact owned process tree
was stopped. A separate MCP context disappeared, and later MCP attempts reported
an in-use profile; no other session's browser or profile was killed or modified.

The latest expansion head's CI browser shards all failed **before test execution**
because Playwright disallows configuring the worker-scoped trace fixture within
a `describe` group. The trace setting is now at file scope. Test collection
successfully found all 60 cases; focused lint/format checks validate the fixture
correction, not runtime acceptance. A planned second-origin regression edit was
blocked twice by a Windows user-mapped-file lock and was not forced through.
The existing snapshot-origin assertions and earlier acceptance gaps remain.

`app/plugins/post-view-transition.client.ts` intercepts only ordinary primary-button
or keyboard activation of a main-listing card's title link or a next/previous
article card. It leaves NuxtLink's
normal handling untouched when the API is unavailable, motion is reduced, forced
colours are active, a dialog is open, the source hero is unloaded/broken/offscreen,
or the link is modified, external, a download, a new tab or contains a query/hash.
Tag listings without heroes do not opt in. Partially visible source images are
eligible; completely offscreen ones are not.

Only the selected source image and the corresponding destination hero share the
`post-hero` name. Card/article metadata verifies the permalink and underlying hero
identity. The destination receives its transition name only after the matching
article has rendered, so the current article hero cannot collide with a selected
next/previous thumbnail during source capture.
The root snapshot is disabled during the effect, so the persistent
header, article text and other layout content do not crossfade. The effect uses
the existing 200 ms duration and easing tokens, with pointer events passed through
to the live page.

The native update callback performs the normal public `router.push`. A public
`page:loading:end` listener verifies the rendered destination, scrolls instantly
to the normal article top and focuses its heading with `preventScroll` before
resolving capture. Nuxt's subsequent deferred top scroll has nowhere further to
move. This intentionally coordinates scroll for the eligible custom navigation;
it does not override the router's global scroll behaviour or access private Nuxt
state. API-absent and reduced-motion navigation retains its original path.

There is no image-decoding or network wait added to navigation. If the destination
hero is not ready or does not intersect the viewport after Vue's pending DOM updates, the animation is
skipped without waiting for image loading or decoding. A 600 ms deadline
from the native update callback also skips capture while asynchronous Content is
still pending, allowing normal loading to be shown instead of keeping the old
render visually frozen. This is a scheduling deadline, not a guarantee against a
blocked main thread or suspended browser. Navigation still completes normally.
The initial 200 ms preparation budget was too short even for warmed client
Content/rendering in the local measurements; 600 ms is the explicit maximum
preparation budget, separate from the 200 ms visual animation. Slow requests are
still skipped rather than being awaited for the sake of an effect.

Another route, history traversal, visibility loss or an application/router error
cancels the pending effect. Interaction and changes to motion/forced-colour
preferences skip its animation. Per-navigation listeners and names are removed on
completion. Native capture errors are logged; navigation exceptions use Nuxt's
error page rather than becoming an unreported success.
Cancellation releases the native update independently of a still-pending router
data request. It does not abort shared Content downloads or let a canceled
transition scroll or focus a newer destination.

Theme changes, filtering, pagination changes themselves, ordinary article links,
anchors and cross-document transitions remain unanimated. This is not
approval for a wider rollout.

### Approved title and neighbour extension (2026-11-09)

The author explicitly selected **"Support partially visible listing images and
next/previous article cards"** after review. A direct listing-title mouse click
started the original effect when the source was fully visible (top=77, bottom=488).
Moving the title near the top of the viewport left the same loaded source at
top=-320, bottom=91; the old visibility gate skipped it. This was not a different
title-link handler.

Both source and destination now require a nonzero rectangle intersecting the
viewport. Next/previous cards carry the target permalink and hero identity, and
their destination thumbnail is the shared source, not the current article hero.
Reduced motion, forced colours, API absence, unloaded/broken/wholly offscreen
media, modified clicks, hashes and all cancellation safeguards still bypass or
skip the effect. The tests cover partially visible listing-title activation and
both neighbour directions, including exactly one source/destination name,
normal top scroll, destination-title focus and route announcements.

Warmed shared-browser checks reached native `ready` and `finished` for all three
new paths: partial-source listing title, previous thumbnail and next thumbnail.
The partial listing source was y=-319.703 to y=91.063; neighbour sources were
approximately 402x226 and grew to approximately 831x467 destination heroes.
Each capture had one named source and one named destination, with the current
article hero unnamed, scroll Y=0 and the appropriate article title focused.
The raw observations are saved as `files/hero-expanded-runtime.json` in session
storage. These checks do not establish intermediate-pixel or screen-reader
approval.

`npm run build` (including artifact/SEO verification), `npm run typecheck` and
`npm run lint` passed for the expanded implementation. Initial test lint findings
were corrected without changing lint rules. The spec now has 20 cases per browser.

With `BASE_URL=http://127.0.0.1:8140`, the bounded command
`npx playwright test post-view-transition.spec.ts --project=chrome --workers=1 --retries=0 --timeout=30000 --global-timeout=90000 --grep 'partly above|article thumbnail'`
failed during setup: a relative `has` locator incorrectly looked for a nested card,
and the previous-thumbnail image decode waited while history scroll returned to
the article top. The locator now uses card metadata directly, and the neighbour
setup waits for the source title and two animation frames before positioning lazy
media, respecting Nuxt's deferred scroll rather than adding a fixed sleep.

A single corrected bounded command with the same options and
`--grep 'partly above|article thumbnail|completely offscreen'` produced **2 passed,
2 failed**: previous-thumbnail capture and wholly offscreen bypass passed;
partial-title activation observed no finished transition, and next-thumbnail
capture was skipped before ready. These failures are not called unrelated or
passed. The corresponding shared-browser paths succeeded, so the local automated
acceptance remains unresolved. No further repeat loop was run. Assertions and
zero retries remain unchanged; each test now retains failed traces and attaches
click eligibility/native lifecycle evidence to support final-head CI diagnosis.

### Visible movement correction (2026-11-09)

Author review exposed an overly strict destination gate: in a 1280x720 preview,
the article hero occupied y=407 to y=897. The image was visible, but its bottom
extended below the viewport, so the trial skipped the native animation entirely.
The destination now needs to intersect the viewport, not fit completely within
it. At that stage the source still needed to be fully visible; the later explicitly
approved extension above changes that source gate. This preserves image readiness,
motion preferences, cancellation and the preparation deadline without changing
the article layout or enabling other transitions.

The regression case uses a laptop-height viewport and samples the rendered native
image group at 0, 100 and 200 ms, with screenshots, rather than inferring movement
from destination geometry or generated keyframes alone.

The corrected, warmed 1280x720 shared-browser navigation reached native `ready`.
Sampling its computed image group in a single bounded callback measured:

| Time   | X       | Y       | Width   |
| ------ | ------- | ------- | ------- |
| 0 ms   | 261     | 151     | 742.891 |
| 100 ms | 211.635 | 348.459 | 841.703 |
| 200 ms | 197     | 407     | 871.016 |

The source rectangle was x=261.047, y=150.781, width=742.891; the destination
rectangle was x=196.984, y=407.016, width=871.016, bottom=896.953. The image
therefore starts at the card's location and moves and grows towards the article,
even though the destination extends below the viewport. These are computed
rendered-group samples, not a recorded video or approval of intermediate pixels.
The shared-browser screenshot command did not preserve a paused intermediate
transition, so it is not used as midpoint evidence.

`npm run build` (including SEO verification), `npm run typecheck` and
`npm run lint` passed for the correction. Typecheck reported GitHub snapshot
403 warnings while retaining saved data. One bounded, single-worker,
zero-retry local Chrome attempt targeting movement, fragment bypass and warmed
mouse activation stalled before producing any test result and was stopped.
No repeat loop was run. The new regression cases therefore still require CI
acceptance; the successful computed movement probe is not a full-suite pass.

The previous implementation head's CI also revealed a definite fragment-test
locator bug: changing the link's hash invalidated its original exact-href locator.
The setup now locates the title link by the card's stable permalink metadata.
The warmed mouse case failed once and passed on retry in Chrome/Edge; that remains
a flake, not a clean pass, and has not been attributed to an unrelated cause.

## Original native experiment and reproduction

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

## Original native geometry and controls

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

## Why the native lifecycle was replaced

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

The author chose the separately approved custom lifecycle approach. Before
styling, require visible, correctly positioned destination capture across cold,
warm and delayed routes without new route/image waits. Keep article-to-article,
pagination/filter, theme and cross-document transitions out of this decision.

## Original native-trial validation limits and preserved evidence

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
  shared-hero animation; none was implemented in that initial diagnostic.

The browser script exited 0 for its navigation, bypass, history, request-delay and
uncaught-error assertions. **The original native acceptance gate failed**; script success
must not be reported as approval to ship.

These original results do not validate the new custom implementation.
`tests/e2e/post-view-transition.spec.ts` now exercises actual named native capture,
top-scroll geometry, focus, history, mobile/light/dark operation, cold Content,
unavailable media, cancellation, errors and fallback eligibility. Its outcomes
and the application checks are recorded in the PR description. Real Windows
Narrator, real browser zoom/display scaling, low-power performance and Safari
require separate manual checks; automated DOM assertions must not be described as
those checks or as merge readiness.

## Implementation validation

The initial custom production build passed, including Pages artifact and SEO
verification, and `npm run typecheck` passed. Actual native captures in Chrome
and Edge demonstrated a loaded hero at scroll Y 0, top approximately 407/bottom
897 CSS pixels, exactly one shared name, no root snapshot and focus on the
article title. These are individual diagnostic results, not a claim that the
complete regression suite passed.

On 2026-11-08, the final cancellation build again passed Pages artifact and SEO
verification, and the final application typecheck passed. Edge cases passed for
mouse/keyboard capture, mobile light/dark rendering, cold-data skip, unavailable
destination media, superseding navigation, route errors, reduced motion, forced
colours and unsupported-API fallback. These passed cases were spread across
bounded diagnostic runs; the full acceptance command did not complete cleanly.

Local Chrome/Edge/Firefox runs also encountered navigation, hydration and browser
setup/teardown timeouts. A ten-repeat, no-retry history investigation passed three
repetitions before stalling and being stopped. This is **not** a ten-repeat pass.
The host's concurrent browser audit and video-controls work reported similar
stalls, but did not establish a root cause or prove these failures unrelated.
No retry increase, relaxed capture assertion, browser exclusion or disabled test
was used to turn those runs into success. Remaining acceptance is explicitly
pending on the final-head CI results, not inferred from the build.

The final review milestone uses the completed static artifact on an isolated
port. Exact final build, typecheck, lint and browser command outcomes belong in
the PR description, including any failing or interrupted runs. The browser spec
preserves capture JSON and before/after screenshots as test attachments.
Session files `custom-hero-capture.json`, `custom-hero-listing.png` and
`custom-hero-article.png` preserve an actual successful custom capture. Partial
runner logs are saved as `custom-hero-*-results.log` and
`custom-hero-history-repeat.log`. Still-image endpoints do not substitute for
reviewing intermediate animation frames or Windows Narrator behaviour.

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
