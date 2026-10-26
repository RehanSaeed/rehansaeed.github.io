# Agent instructions

## README changes

Do not modify README.md unless the user explicitly requests it. Put implementation
details in relevant documentation or code comments, not the README.

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
- Treat [content.config.ts](content.config.ts) as the source of truth for front
  matter. Create the post directory and Markdown file directly, using relevant
  published articles as examples. Check that the target does not already exist
  and never overwrite an existing article when creating a new one.
- Keep work focused on the requested article and its promotion. Do not change the
  website, install publishing integrations or require Buffer as part of drafting.

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

## Nuxt Components

- Do not use inline styles (`style` attributes or Vue `:style` bindings). Put
  styling in component stylesheets and use intrinsic HTML sizing where suitable.
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
- Use an existing, relevant hero image or supply an appropriately licensed one.
  Hero images must match the schema's `/images/...-<width>x<height>.png` or JPEG
  naming pattern, with dimensions matching the actual file. Choose an image
  relevant to the article rather than copying another post's image by default.
- Put article-specific images in the post's `images` directory and reference them
  relatively, for example `![Descriptive alt text](./images/example.png)`.
  Keep captions, alt text and attribution accurate; do not fabricate screenshots.
- Do not manually populate generated fields such as `rawbody`, `headings` or
  `timeToRead`.

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
`permalink`), an explicit `Draft - not approved for posting` status, and a separate
copy-ready section for each destination below. Keep notes outside the copy-ready
text. Use the canonical URL by default; do not invent tracking parameters,
account handles or publication dates.

| Destination         | Draft requirements                                                                                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mastodon            | Explain the problem and one useful finding, include the link and a few relevant hashtags. Check the target instance's current character limit.                                                                                                          |
| Bluesky             | Lead with a concise takeaway and include the link. Check the current character limit; only propose a thread when needed, with each part separately reviewable.                                                                                          |
| LinkedIn            | Explain the practical professional relevance, include concrete takeaways and the link. Keep the author's voice rather than adopting a sales pitch.                                                                                                      |
| Reddit profile      | Prepare a straightforward title and announcement for [u/muhammadrehansaeed](https://www.reddit.com/user/muhammadrehansaeed/). Posting directly to this profile is distinct from submitting to a subreddit; verify the signed-in account before posting. |
| Selected subreddits | Create a separate title and body for each user-selected community, tailored to its audience and allowed post type. Provide useful substance without requiring a click, disclose authorship and include the link only where allowed.                     |

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
- Keep all claims supported by the article. Tailor the wording rather than
  blasting identical copy everywhere. Avoid engagement bait, unnecessary mentions
  and promises to answer questions that the author has not agreed to.

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
- After each submission, verify the published result and record its URL and
  destination in the promotion pack with its status. Distinguish confirmed posts,
  failures, pending moderation and uncertain submissions.
- Check existing records and the platform before retrying an uncertain
  submission. Never duplicate posts on a retry or treat an article edit as
  permission to repost.
