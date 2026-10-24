# Blog and Social Media Authoring

These instructions apply to agents working in this repository. Draft articles and
their social announcements as separate, reviewable deliverables. Finishing a draft
does not authorise publishing the article or posting to social media.

## Repository Conventions

- This is Muhammad Rehan Saeed's software engineering blog at
  <https://rehansaeed.com>, built with Nuxt, Vue and Nuxt Content.
- Read [README.md](README.md), [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md)
  and [.editorconfig](.editorconfig) before making changes.
- Articles live in `content/posts/<year>/<kebab-case-slug>/index.md`.
  Read a few relevant published articles before drafting to match the author's
  voice and avoid duplicating existing coverage.
- Treat [content.config.ts](content.config.ts) as the source of truth for front
  matter. Use [NewPost.ps1](NewPost.ps1) as the starting scaffold, checking that
  its target does not already exist before running it.
- Keep work focused on the requested article and its promotion. Do not change the
  website, install publishing integrations or require Buffer as part of drafting.

## Drafting a New Blog Post

1. Establish the topic, intended reader, problem being solved and main takeaway
   from the user's brief. Ask about missing decisions that materially change the
   article; otherwise make reasonable assumptions and identify them for review.
2. Inspect related posts and current primary sources. Verify version-sensitive
   APIs, commands and recommendations against official documentation. Link to
   supporting sources and relevant existing articles using their permalinks.
3. Organise the article around a clear introduction, practical explanation,
   examples, trade-offs and a useful conclusion. Show an outline for approval
   when the user requests one; otherwise proceed with the draft.
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
  naming pattern, with dimensions matching the actual file. Do not leave the
  scaffold's default image without checking its relevance.
- Put article-specific images in the post's `images` directory and reference them
  relatively, for example `![Descriptive alt text](./images/example.png)`.
  Keep captions, alt text and attribution accurate; do not fabricate screenshots.
- Do not manually populate generated fields such as `rawbody`, `headings` or
  `timeToRead`.

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

Include the article title, canonical URL (`https://rehansaeed.com` plus
`permalink`), an explicit `Draft - not approved for posting` status, and a separate
copy-ready section for each destination below. Keep notes outside the copy-ready
text. Use the canonical URL by default; do not invent tracking parameters,
account handles or publication dates.

| Destination         | Draft requirements                                                                                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mastodon            | Explain the problem and one useful finding, include the link and a few relevant hashtags. Check the target instance's current character limit.                                                                                      |
| Bluesky             | Lead with a concise takeaway and include the link. Check the current character limit; only propose a thread when needed, with each part separately reviewable.                                                                      |
| LinkedIn            | Explain the practical professional relevance, include concrete takeaways and the link. Keep the author's voice rather than adopting a sales pitch.                                                                                  |
| Reddit profile      | Prepare a straightforward title and announcement for `u/<username>`. Posting directly to a profile is distinct from submitting to a subreddit; confirm the actual account before posting.                                           |
| Selected subreddits | Create a separate title and body for each user-selected community, tailored to its audience and allowed post type. Provide useful substance without requiring a click, disclose authorship and include the link only where allowed. |

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
