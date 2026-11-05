# Agent instructions

## Human documentation and agent work records

- README.md and CONTRIBUTING.md (including .github/CONTRIBUTING.md)
  are human-facing documentation, not agent work logs.
- Do not modify these files unless the user explicitly requests changes
  to them. A general request to implement a feature, fix a bug or update
  documentation is not permission to edit these files.
- Do not append task summaries, implementation details, debugging notes,
  validation results, temporary workarounds or agent instructions to them.
- Put change summaries and validation results in the pull request description.
  Keep temporary investigation notes in session storage outside the repository.
- Keep durable agent-specific guidance in AGENTS.md, not human documentation.
  Do not use AGENTS.md as a task log either.

## Blog and Social Media Authoring

These instructions apply to agents working in this repository. The author writes
the article text; agents help with requested corrections and prepare social
announcements as a separate, reviewable deliverable. Finishing a draft does not
authorise publishing the article or posting to social media.

## Repository Conventions

- This is Muhammad Rehan Saeed's software engineering blog at
  <https://rehansaeed.com>, built with Nuxt, Vue and Nuxt Content.
- Read [README.md](README.md), [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md)
  and [.editorconfig](.editorconfig) before making changes.
- Articles live in `content/posts/<year>/<kebab-case-slug>/index.md`.
  Read a few relevant published articles before drafting to match the author's
  voice and avoid duplicating existing coverage.
- Include relevant internal links to existing articles using their permalinks
  wherever possible. Use authoritative external links when there is no suitable
  internal article, especially for official documentation and supporting sources.
- When mentioning a person, link their name to their blog. If they do not have a
  blog, link to a verified social media profile instead. Verify that the
  destination belongs to the person; do not guess URLs or handles.
- Treat [content.config.ts](content.config.ts) as the source of truth for front
  matter. Create the post directory and Markdown file directly, using relevant
  published articles as examples. Check that the target does not already exist
  and never overwrite an existing article when creating a new one.
- Keep work focused on the requested article and its promotion. Do not change the
  website, install publishing integrations or require Buffer as part of drafting.

## HTML

- Use semantic HTML elements that reflect the content's meaning and purpose.
- Use accessible HTML with native controls, accessible names and labels, and
  keyboard support. Use ARIA only when native HTML semantics are insufficient.

## CSS

- Do not use inline styles (`style` attributes or Vue `:style` bindings). Put
  styling in component stylesheets and use intrinsic HTML sizing where suitable.
- Follow Block Element Modifier (BEM) naming for CSS classes.
- Use CSS logical properties instead of physical properties where applicable.
- Prefer CSS Grid to Flexbox for layout; use Flexbox when wrapping content is
  better suited to it.
- Follow [CSS General Rules of Thumb](https://rehansaeed.com/css-general-rules-of-thumb/).
- Group and sort CSS properties following
  [A System for Grouping & Sorting CSS Properties](https://rehansaeed.com/system-for-grouping-and-sorting-css-properties/).

## TypeScript

- Use TypeScript for application code.
- Use modern functions and APIs supported by the project's target environments.
- Prefer `const` arrow functions over function declarations.
- Use JSDoc to document public-facing properties.
- Use the existing [Zod](https://zod.dev/) dependency for runtime data validation.
  Validate external JSON as `unknown` and infer TypeScript types from schemas
  instead of asserting that responses match an interface. Reuse shared schemas
  and surface validation failures through the existing error-handling paths.

## Contact Email Privacy

- Keep contact email addresses obfuscated using the existing obfuscation helpers.
  Never write decoded addresses into tracked files, including tests,
  documentation or agent guidance, or commit messages and pull request
  descriptions.
- Test expected obfuscated values and decode them at runtime for mailto
  assertions. Preserve the existing protection against exposing decoded
  addresses in generated pages, payloads and scripts before link activation.
- Check staged changes for plaintext contact addresses before committing.
  Automatic app checkpoints can capture uncommitted files, so never use tracked
  files as temporary storage for decoded addresses.

## Accessibility and Responsive Design

- Support both light and dark modes.
- Support Windows High Contrast Mode, including CSS `forced-colors`, without
  losing visible controls, focus indicators or meaningful content.
- Keep layouts responsive and usable at up to 200% browser zoom and display
  scaling, without clipping content or making controls inaccessible.
- Support the Windows Narrator screen reader with meaningful reading order,
  accessible names, roles and states, and announcements for dynamic updates.
- For UI changes, verify both colour modes, High Contrast Mode, responsiveness
  at 200% zoom and display scaling, and Windows Narrator behaviour. Report any
  checks that could not be performed rather than claiming support was verified.

## Testing, Builds and CI

- Use Prettier for formatting and ESLint for linting, following the repository's
  configuration.
- Keep Nuxt's strict type-aware TypeScript linting, recommended Vue accessibility
  and Playwright rules, public-property JSDoc checks, and selected Unicorn rules
  enabled. Do not use `all` presets. Document public component props and exported
  interface, object type and class properties with meaningful JSDoc descriptions.
- Add or update tests for behaviour changes and regression tests for bug fixes.
  Test observable behaviour, not implementation details.
- Run `npm run test:lint` for lint-configuration changes and `npm run test:unit`
  for changes to the tested shared utilities.
- Run the smallest relevant checks while developing. Before handing off
  application or dependency changes, run `npm run build`, `npm run typecheck`,
  `npm run lint`, and relevant Playwright tests. Instruction-only changes need
  a focused Prettier check.
- Treat a build as successful only when the command exits successfully,
  including SEO verification. A successful build does not prove accessibility,
  browser behaviour or article code samples are correct.
- Do not hide failures by skipping tests, weakening assertions, increasing
  retries, disabling checks or changing visual baselines without reviewing the
  differences. Investigate flaky tests with
  `npx playwright test <test-file> --repeat-each=10 --retries=0`.
- After pushing, inspect GitHub Actions for the latest commit. Report pending,
  failed, cancelled or skipped checks accurately; do not describe them as passed.
- Investigate failed jobs using their logs and artifacts. Fix failures caused by
  the changes; report unrelated failures explicitly.
- Require successful generation, type checking, linting, Chrome/Edge/Firefox
  tests and CodeQL before declaring the PR ready to merge. Never bypass required
  checks or merge without explicit approval.
- The Build and CodeQL workflows skip draft PRs. Skipped draft checks are not
  validation evidence.
- Record exact validation commands and outcomes in the PR description, including
  checks that could not be run. Distinguish local validation, CI results and
  manual accessibility checks.

## Nuxt Components

- Use Composition API with `<script setup lang="ts">` by default.
- Use `setup()` returning a render function when direct VNode rendering is
  needed. Explain exceptions and preserve existing behaviour.
- Keep shared state at module scope, not in per-instance `<script setup>` scope.
- Use Nuxt's build-time component auto-imports for template usage instead of
  explicit imports and Options API `components` registrations. Auto-imports
  include only used components and add no runtime registration overhead compared
  with equivalent explicit imports.
- Application components use the `U` prefix without directory prefixes, as
  configured in `nuxt.config.ts`: `shared/heading.vue` is `<u-heading>` (or
  `<UHeading>`). Keep filenames unique across application component directories.
- Keep Nuxt Content components in `app/components/content` globally registered
  under their unprefixed names so Markdown rendering can resolve them. Do not
  globally register ordinary application components.
- Scan `app/components/OgImage` separately as server-only islands before the
  application component directory, without the application `U` prefix. Nuxt skips
  later scans inside an already scanned parent, even when files were ignored.
- Retain explicit imports when script logic needs a component object, such as
  `NuxtLink` used in a computed value for `<component :is="...">`, or when a
  component is outside Nuxt's configured scan directories. Auto-importing is
  separate from lazy loading and delayed hydration; preserve those behaviours.

## Authoring and Correcting Blog Posts

The author writes the article text. Do not independently draft, expand or rewrite
an article unless explicitly asked. When asked for corrections, make focused edits
for spelling, grammar, clarity or technical accuracy within the requested scope.
Preserve the author's voice, meaning, structure and opinions; flag substantive
uncertainties rather than inventing replacement claims.

When explicitly asked to help draft an article, follow these guidelines:

1. Establish the topic, intended reader, problem being solved and main takeaway
   from the user's brief. Ask about missing decisions that materially change the
   article; otherwise make reasonable assumptions and identify them for review.
2. Inspect related posts and current primary sources. Verify version-sensitive
   APIs, commands and recommendations against official documentation. Link to
   supporting sources and relevant existing articles using their permalinks.
3. Organise the article around a clear introduction, practical explanation,
   examples, trade-offs and a useful conclusion. Show an outline for approval
   when the user requests one; otherwise work within the requested drafting scope.
4. Write in the author's first-person voice using British English. Be direct,
   technically precise and approachable, with restrained humour where appropriate.
   Avoid marketing filler, clickbait and generic AI phrasing. Never invent personal
   experiences, quotations, benchmark results or claims of testing.
5. Include realistic code or commands with language-labelled fences. Explain
   prerequisites, relevant versions, expected results and important limitations.
   Run examples where feasible and clearly distinguish illustrative snippets from
   verified, executable examples.
6. Review the complete article for accuracy, flow, repetition, accessibility and
   unsupported claims. Flag unresolved questions instead of presenting guesses as
   facts.

### Metadata and Assets

- Populate `title`, `description`, `author`, `permalink`, `heroImage`, `date`,
  `dateModified`, `published`, `categories` and `tags` following existing articles.
  Use `Muhammad Rehan Saeed` as the author unless instructed otherwise.
- Choose a descriptive, stable permalink such as `/example-topic/`; do not derive
  the public URL from the content directory's year. Avoid collisions with existing
  post and portfolio permalinks.
- Keep `published: false` until the user explicitly approves publication. A draft
  is not private: the site can render unpublished articles at their permalinks,
  and this repository is public. Do not commit confidential material.
- Use an accurate ISO date or timestamp, leave `dateModified: null` for a new post,
  and agree the publication date when preparing it for release. For substantive
  updates, retain the original date and permalink and update `dateModified`.
- Reuse appropriate category and tag names. Add `series` and numeric `seriesOrder`
  only when the article actually belongs to a series.
- Use full, descriptive tag names, including an acronym in parentheses where
  useful: for example, `Artificial Intelligence (AI)` rather than `AI`.
  Prefer an existing full-name tag over introducing an acronym-only variant.
- Use an existing, relevant hero image or supply an appropriately licensed one.
  Hero images must match the schema's `/images/...-<width>x<height>.png` or JPEG
  naming pattern, with dimensions matching the actual file. Choose an image
  relevant to the article rather than copying another post's image by default.
- For new posts, use a **1600x900** hero image, the larger of the two common
  formats in this repository; **1366x768** is the older format. Prefer a source
  image at least that large, preserve its aspect ratio and avoid cropping
  important content. Enlarging a small source does not add detail. Do not resize
  unrelated existing heroes.
- Put article-specific images in the post's `images` directory and reference them
  relatively, for example `![Descriptive alt text](./images/example.png)`.
  Keep captions, alt text and attribution accurate; do not fabricate screenshots.
- Do not manually populate generated fields such as `rawbody`, `headings` or
  `timeToRead`.

### Media Captions

- Use native `<figure>` and `<figcaption>` markup for explicitly authored image
  and video captions. Keep blank lines around Markdown inside an HTML figure so
  it is parsed normally; MDC component syntax is disabled.

  ```markdown
  <figure>

  ![Alternative text describing the image](./images/example.png)

  <figcaption>
    A visible caption explaining why the image matters.
    <small>Credit: <a href="https://example.com/">Source</a></small>
  </figcaption>
  </figure>
  ```

- For video, replace the image with a native `<video controls>` element (with
  appropriate accessible alternatives), or an existing supported standalone
  YouTube URL surrounded by blank lines.
- Write captions separately from alt text; do not generate captions from it.
  Omit the `<small>` credit line when it is not needed. Shared caption typography
  belongs in `app/assets/style/dom/_figcaption.scss`; media width and alignment
  belong in the containing component.

### Hero Image House Style

- Aim for a personal software engineering publication: technically literate,
  approachable and witty, not a generic AI product landing page.
  Illustrate the article's central idea rather than assembling unrelated
  technology symbols.
- Use [the theme tokens](app/assets/style/_properties.scss) as the visual
  reference: neutral light or charcoal surfaces, strong contrast and restrained
  purple accents. Topic-specific colours, such as Vue green, are welcome when
  meaningful; do not recolour official logos to force them into the palette.
- Prefer clear flat graphics, diagrams or restrained ink-style editorial
  illustrations. Use simple shapes, deliberate linework and a small palette.
  Subtle texture can add character, but avoid making every article look like an
  aged-paper poster or a glossy stock render.
- Avoid generic AI imagery: shiny robot mascots, glowing brains, neon circuitry,
  holographic dashboards and excessive cinematic lighting. Show concrete tools
  and workflows when relevant. An article about agents does not automatically
  need a robot.
- Keep one clear visual story, generous negative space and a readable silhouette
  at card-thumbnail and mobile sizes. Avoid clutter, ornamental UI panels and
  tiny details that only work at full resolution.
- Do not bake the article title, fake code or generated lettering into the image.
  Let the site render its own headings. If a graphic genuinely needs labels,
  typeset them separately using the existing Audiowide heading or Cascadia Code
  code typography as appropriate; verify every label.
- Follow the existing 1600x900 sizing and image-optimisation requirements. Keep
  important content clear of crop edges, and check the hero in both light and
  dark themes, on the article and in a small card preview.
- Preserve the author's chosen concept when revising an image; change the visual
  treatment rather than inventing a different message. Show the result for
  review, and do not claim generated imagery is a real screenshot or photograph.

#### Recurring Author Character

Prefer hero images featuring the recurring author character described below.
This is the default, not a requirement: use a different visual concept when it
better serves the article. The desk and workspace remain optional even when the
character appears.

- Make the character recognisably resemble the author rather than using a generic
  person. Use
  [the author's profile photo](public/images/author/Muhammad-Rehan-Saeed/Profile-320x480.jpg)
  or a newer user-supplied photo as the visual reference, not a previous generated
  image alone. Preserve recognisable facial features, hairstyle, facial hair and
  body proportions within the chosen illustration style. Keep the head angle,
  gaze and anatomy consistent with the intended pose. Do not invent a different
  appearance. Ask for a suitable reference if the available photo is insufficient.
- Keep the short, straight dark hair, natural grey detail and beard with
  moustache recognisable. Use a simple, lightly combed hairstyle with
  modest volume, not dense curls, ringlets, a hair bun or an invented hairstyle.
- Keep natural masculine proportions and a relaxed, believable posture. Use a
  regular men's clothing silhouette with straight shoulders and torso rather
  than a fitted waist, exaggerated muscles or a caricature.
- The default outfit is a plain golden-ochre (`#D9A74A` base colour) men's
  crew-neck jumper with a regular fit, ribbed collar, cuffs and straight hem.
  Keep shading close to this base colour. Use subtle texture and a few folds,
  not floral motifs, decorative swirls or busy knit patterns.
- Keep the jumper's warm golden-ochre yellow as the character's signature
  colour. It should make him stand out against quieter backgrounds and
  supporting objects, rather than blending into the scene. Do not recolour
  the jumper purple merely to match the site accent.
- Pair it with dark indigo, straight-cut denim jeans, approximately `#243B5A`.
  Make the trouser construction legible: distinct legs, natural knee bends,
  seams and restrained folds. In seated poses, show credible thigh and calf
  volumes with clear separation or overlap, not one flared, skirt-like shape.
- When footwear is visible, use Vivobarefoot knit trainers with sage-green
  (`#949F8D`) uppers, cream (`#E5E0C8`) laces and thin, flat soles, and darker green
  (`#51574A`) heel detail. Use these as base colours with restrained shading.
  Keep the wide anatomical toe box, low profile and small pull loops. Suggest
  the knit and subtle geometric side motif with simple ink marks, not
  photographic product detail.
- Keep the overall treatment warm, understated and editorial: charcoal ink
  outlines, restrained flat colour and light print texture. Ochre clothing and
  dark blue denim should remain consistent across illustrations.
- Pale lavender (`#F0E9F9`) is a suitable background within the house palette.
- Choose the activity, pose and props to serve each article. Keep the head,
  gaze and hands directed naturally towards the task.
- Inspect the face, neck, hands, clothing and seated anatomy at full resolution
  as well as thumbnail size. Correct malformed grips, disconnected joints or
  ambiguous garment silhouettes before presenting the final image. When showing
  the full seated figure, include both lower legs and naturally grounded feet;
  do not leave missing legs or knee-length stumps to fit the furniture.

#### Optional Author Workspace

The desk is a reusable visual reference, not a required hero-image setting.
Featuring the author character does **not** require featuring his desk or
workspace. Choose the scene that best communicates the article. When a desk scene
is useful, include only the relevant items below rather than forcing every prop
into the composition; their arrangement can change with the pose and framing.

- Use a four-legged FlexiSpot electric standing desk with an **extra thick**
  natural oak top, four telescopic metal lifting columns and a restrained
  charcoal frame. Set its height to suit the character's seated or standing
  pose. Mount the height-control keypad at the **far-right end of the front
  edge**, not near the centre. Keep it beside the right-front desk leg, not
  directly in front of or obscuring the leg.
- The chair is a graphite Herman Miller Aeron: recognisable mesh back and seat,
  curved frame, understated armrests and a central five-spoke caster base.
  Preserve plausible posture, support and legroom rather than distorting the
  character to expose every chair detail.
- On the desktop, use a small oak pencil holder with a few Blackwing pencils,
  each with its distinctive wide, flat rectangular rubber in a metal ferrule at
  one end. Add a matching oak plant container holding a leafy green houseplant.
  Keep both containers visibly wooden, with restrained oak grain rather than
  grey ceramic or metal surfaces.
- Include a cream-paper writing pad and a normal hand-sized fountain pen when
  writing accessories suit the scene. The pen has a transparent plastic
  demonstrator barrel with visible shimmer ink. Choose a random ink colour for
  each new illustration rather than using a fixed colour, and suggest shimmer
  with only a few subtle flecks. Keep its nib and separate clear cap
  proportionate. It should be a small desk accessory, not span the whole pad.
- Small stacks of simply bound books can support the scene. Avoid invented
  readable titles, decorative clutter or adding objects just to fill space.
- A modest, open-topped wicker wastepaper basket sits on the floor under the
  left side of the desk. Use natural tan wicker, a gently tapered shape and
  simple woven hatching; keep the desk legs visible and the basket grounded.
- Render the pen, furniture and accessories with the same simplified
  charcoal outlines, restrained flat colours and light texture as the rest of
  the illustration. Suggest transparent plastic and shimmer with a few marks,
  not glossy highlights or photorealistic objects pasted into an ink drawing.

### Updating Published Posts

- Retain the original `date` and `permalink`. For substantive changes to a
  published post, set `dateModified` to the actual update date and add a short
  dated note at the top of the article body, immediately after the front matter
  and before the introduction or series links.
- Use the existing tip-container convention with an unambiguous ISO date:

  ```markdown
  ::: tip Update (2026-10-25)
  Updated the configuration example for the new API and explained the migration steps.
  :::
  ```

- Describe what actually changed and any important effect on readers. The date
  must match `dateModified` (the calendar date when it contains a timestamp).
  Use the real update date, not the example date.
- Keep earlier update notes and their dates, placing the newest first. Combine
  changes from the same update into one note rather than adding duplicate notes.
- Minor spelling, grammar or formatting corrections do not need an update note
  or a changed `dateModified` unless the author requests one. Unpublished drafts
  do not need a published-post update history.
- Updating an article does not authorise publishing new social announcements.

### Validation and Review

- Follow the existing Markdown style. Check links, image paths, front matter and
  the rendered article, including code blocks and any diagrams or tables.
- Use the scripts in [package.json](package.json). For article changes, run
  `npm run build`, which also runs SEO verification. Use `npm run dev` for visual
  review; run targeted existing Playwright tests when relevant to the change.
  For instruction-only changes, a focused Markdown formatting check is sufficient.
- Report the exact validation commands and outcomes, including anything that
  could not be run. Do not claim that a successful site build verifies the
  article's code samples or technical assertions.
- Open a pull request for repository changes using
  [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).
  Distinguish ready for author review from approved for publication.

## Drafting Social Posts After the Article Is Finished

Once the article is complete enough for author review, prepare a promotion pack
without waiting for a separate reminder. Base every announcement on the final
article, not an earlier outline. Refresh the pack if the article changes.

Save it as `social.md` beside the article's `index.md`, outside the article body
and front matter. Only `index.md` is collected as the article. The promotion pack
is still visible in the public repository, so it must not contain credentials,
private account details or confidential review notes.

Include the article title, canonical URL (<https://rehansaeed.com> plus
`permalink`), and a separate copy-ready section for each destination below. Use
distinct emoji in section headings to make destinations and supporting sections
easy to scan. Keep source attribution and destination choices outside the
copy-ready text. Do not add `Review notes` sections; report posting blockers in
the conversation instead. Do not add routine character-count notes,
publication-status labels,
approval boilerplate or posting logs that require maintaining the file after
publication. Still check character limits and obtain posting approval as
described below. Use the canonical URL by default; do not invent tracking
parameters, account handles or publication dates.

For short-form platforms such as Mastodon and Bluesky, keep announcements simple:

```text
Just blogged "<Blog Title>"

<Canonical URL>

#RelevantTag1 #RelevantTag2 #RelevantTag3
@RelevantPerson1 @RelevantPerson2
```

Replace placeholders with the actual title, URL and relevant hashtags. Include
mentions only when the people are relevant and their platform-specific handles
have been verified; otherwise omit the mentions line. Respect each platform's
current character limit, including its treatment of URLs and mentions.

On platforms allowing longer messages, such as LinkedIn and Reddit, add one
concise paragraph about the post in addition to the announcement and link.
Keep the paragraph in the author's voice and tailor it to the audience. Adapt
hashtags and mentions to the destination rather than forcing them into Reddit
posts or communities where they are inappropriate.

| Destination         | Draft requirements                                                                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mastodon            | Use the short announcement template, with the link, relevant hashtags and optional verified mentions. Check the target instance's current character limit.                                                                                                                            |
| Bluesky             | Use the short announcement template as a single post, with the link, relevant hashtags and optional verified mentions. Check the current character limit.                                                                                                                             |
| LinkedIn            | Use the announcement, one paragraph about the post, the link, relevant hashtags and optional verified mentions. Keep the author's voice rather than adopting a sales pitch.                                                                                                           |
| Reddit profile      | Prepare a straightforward title, announcement and one paragraph about the post for [u/muhammadrehansaeed](https://www.reddit.com/user/muhammadrehansaeed/). Posting directly to this profile is distinct from submitting to a subreddit; verify the signed-in account before posting. |
| Selected subreddits | Create a separate title and body for each user-selected community, tailored to its audience and allowed post type. Provide useful substance without requiring a click, disclose authorship and include the link only where allowed.                                                   |

- If subreddit destinations are not specified, propose a small, relevant shortlist
  for approval rather than treating it as an authorised distribution list.
- Check each selected subreddit's current rules, pinned guidance, flair and
  self-promotion restrictions. Record the source and date checked in the pack.
  If rules cannot be verified, mark the destination as blocked pending review.
  Never assume a universal "10% self-promotion" allowance.
- Check platform length limits using their counting rules, including treatment
  of links, and leave space for any approved additions. Do not blindly truncate.
- Include an image suggestion and alt text where useful. Do not claim an image,
  link preview or attachment has been checked unless it actually has.
- Keep all claims supported by the article. Keep the short announcement formula
  consistent, tailoring longer paragraphs, hashtags and mentions to each
  destination. Avoid engagement bait, unnecessary mentions and promises to answer
  questions that the author has not agreed to.

## Approval and Optional Browser Posting

- Drafting is the default stopping point. Do not publish, schedule, cross-post or
  submit anything without explicit approval of the final text, accounts and
  destinations. Article approval is not social-post approval.
- The intended workflow is agent-generated drafts, user review and edits, then
  optionally agent-assisted browser posting. Buffer is not required.
- Verify that the available browser tooling can control the intended session.
  Do not assume access to existing Firefox windows, profiles or logins. If it
  cannot, explain the limitation and provide the approved text for manual posting.
- Let the user handle login, MFA and CAPTCHAs. Never request passwords in chat,
  copy browser credentials or bypass access controls.
- Before posting, verify the public article is live and correct, the signed-in
  account is the intended one, and the composer contains the approved text,
  visibility, link, images and flair. Stop for approval if a material change is
  needed or community rules disallow the submission.
- After each submission, verify the published result and report its URL,
  destination and outcome in the conversation, not a posting log in `social.md`.
  Distinguish confirmed posts, failures, pending moderation and uncertain
  submissions.
- Check previous conversation results and the platform before retrying an uncertain
  submission. Never duplicate posts on a retry or treat an article edit as
  permission to repost.

## Image Optimisation

- Optimise new or modified raster images before committing, preferably using
  [Squoosh](https://squoosh.app/). Do not recompress unrelated existing images.
- Resize images to appropriate display dimensions and compare the optimised
  output with the original. Preserve acceptable visual quality, transparency and
  any required metadata. Keep filenames and declared dimensions accurate.
- Preserve lossless output where exact pixels matter, including reviewed
  screenshots, logos and shortcut icons; do not apply lossy or palette-reducing
  compression to these assets without explicit approval.
- Keep images covered by `.gitattributes` tracked with Git LFS.
- If compression tooling is unavailable, report that explicitly rather than
  claiming the image was optimised.
