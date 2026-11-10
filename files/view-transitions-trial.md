# Nuxt-native hero view transitions

On **2026-11-10**, the author chose Nuxt's built-in integration instead of the
custom navigation controller. This supersedes the earlier custom implementation;
its original experiments and validation history remain in earlier PR revisions.

## Integration and scope

`nuxt.config.ts` enables `experimental.viewTransition` but sets
`app.viewTransition: false`. Ordinary navigation therefore remains unanimated.
No new dependency is required.

`app/plugins/post-view-transition.client.ts` supplies application-specific
eligibility and hero preparation, not a second router or native update callback:

- A listing title/stretched card or next/previous article link selects one loaded
  source image intersecting the viewport. Modified/new-tab/download/query/hash
  links, dialogs, reduced motion, forced colours and absent API support bypass
  the enhancement.
- A normal NuxtLink activation performs navigation. The route guard opts only
  the selected destination into Nuxt's `viewTransition` page metadata.
- Nuxt creates the native transition, coordinates its update callback with
  routing and handles navigation errors. The application neither prevents the
  link's default handling nor calls `router.push` or `startViewTransition`.
- The public `page:view-transition:start` hook observes the transition and bounds
  frozen preparation to 600 ms. Slow Content loading skips the animation rather
  than introducing a new data/image wait.
- A synchronous `page:finish` hook verifies the destination's permalink and hero
  identity, names the destination image, sets normal article-top scroll and
  focuses the title with `preventScroll`. It skips an unavailable or offscreen
  destination image rather than waiting for decoding.
- Completion removes application names and listeners do not accumulate per
  navigation. Superseding routes, history, visibility changes and errors clear
  the selection; input and motion-preference changes skip the effect.

Only the selected thumbnail and matching destination hero share `post-hero`.
The current article hero stays unnamed during neighbour-source capture.
The existing 200 ms CSS effect disables the root snapshot, so the persistent
header and surrounding content switch without a page-wide fade. Theme changes,
ordinary article links, anchors, filtering, pagination and cross-document
navigation are not added to the trial.

## Why the scroll hook remains

The original unmodified Nuxt 4.6.4 experiment captured the destination at the
listing's deep scroll position in Chrome, Edge and Firefox. Representative hero
tops at native `ready` were approximately -3138 CSS pixels, although the images
were loaded. Nuxt's normal scroll subsequently moved them to approximately y=407.
This was a capture-ordering failure, not a CSS-duration problem.

Nuxt completes its native update on `page:finish`; its normal router scroll waits
for `page:loading:end` and another animation frame. The replacement prepares
geometry synchronously at `page:finish`, without requesting a frame while native
capture suppresses rendering. It does not modify global scroll behaviour, use
private Nuxt state or hold a second promise around routing.

The existing runtime geometry assertions remain the acceptance gate for this
ordering. Enabling the configuration alone is not evidence that it works.

## Acceptance and limitations

`tests/e2e/post-view-transition.spec.ts` covers warmed mouse/keyboard navigation,
deep-scroll history restoration, partial source visibility, both neighbour
directions, a laptop-height destination extending below the viewport, mobile
light/dark rendering, slow Content, unavailable images, superseding navigation,
failed navigation and reduced-motion/forced-colour/API fallbacks. It also checks
that ordinary navigation never opts into the hero trial.

Warmed cases use Playwright's standard page fixture so HTTP caching remains
enabled. The shared request-routing fixture disables that cache, making a new
destination image request cold even after a previous visit. Controlled cold-data,
unavailable-image and navigation-error cases still install their explicit routes.
Capture geometry, image-readiness assertions and preparation deadlines are not
relaxed to accommodate an unready image.

Nuxt's payload guard can wait before its native transition starts. To exercise
the 600 ms limit on an actually frozen update, cold-data tests return an empty
article payload and delay the subsequent Content SQL request. Delaying the
prerendered payload instead would test a pre-capture loading phase, not that limit.
Source-geometry tests also await the card's existing focus animation before
activation, so their reference rectangle is stationary when the browser captures
it. They do not loosen pixel tolerances or disable application animations.

Nuxt rejects its native update when navigation fails. The error regression checks
that rejection, the visible error page, cleared transition state and recovery;
it does not require the former custom controller's successful native completion.
Every other case requires no unexpected native rejection.

Actual first/mid/end image evidence for the earlier custom implementation is
preserved in session files `origin-150-*.png` and `origin-650-*.png`. It must not be
presented as proof of this replacement. The author's fixed-top appearance was
specific to the embedded preview; its cause has not been isolated.

Exact final-head validation commands and outcomes belong in PR #1437. A site
build alone does not establish animation correctness or accessibility. Windows
Narrator, real High Contrast, 200% zoom/display scaling, Safari, low-power
performance and real-time visual approval remain separate manual checks.
Do not merge without the author's explicit approval.

## Primary sources

Retrieved **2026-11-10**:

- [Nuxt transitions documentation](https://nuxt.com/docs/4.x/getting-started/transitions#view-transitions-api-experimental):
  experimental integration, page opt-in, reduced motion and asynchronous-data
  limitations.
- [Nuxt 4.6.4 native transition plugin](https://github.com/nuxt/nuxt/blob/v4.6.4/packages/nuxt/src/app/plugins/view-transitions.client.ts):
  native routing coordination, start hook, completion and error handling.
- [Nuxt 4.6.4 page lifecycle](https://github.com/nuxt/nuxt/blob/v4.6.4/packages/nuxt/src/pages/runtime/page.ts):
  rendered-page completion before loading-end notification.
- [Nuxt 4.6.4 router scroll behaviour](https://github.com/nuxt/nuxt/blob/v4.6.4/packages/nuxt/src/pages/runtime/router.options.ts):
  loading-end and animation-frame ordering, saved positions and anchors.
