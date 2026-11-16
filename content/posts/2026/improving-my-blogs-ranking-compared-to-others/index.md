---
title: "Improving my blogs ranking compared to others"
description: "How I used an AI-assisted comparison of 51 engineering blogs to find concrete improvements, then turn the weakest areas into focused agent tasks."
author: "Muhammad Rehan Saeed"
permalink: "/improving-my-blogs-ranking-compared-to-others/"
heroImage: "/images/hero/Comparing-Blog-Designs-With-A-Human-Reviewer-1600x900.png"
date: "2026-11-16"
dateModified: null
published: false
categories:
  - "Thoughts"
  - "Web"
tags:
  - "Artificial Intelligence (AI)"
  - "GitHub Copilot"
  - "Accessibility"
---

After [upgrading my blog with AI agents](/ai-learnings-from-upgrading-my-blog/), I wanted to know what to improve next. I could keep asking an agent to "make it better", but better compared to what?

So I asked for 50 famous software engineers' blogs, a comparison across design categories and an interactive HTML report. Then I asked agents to get my blog to 83 out of 100.

Giving myself homework, with extra steps.

The useful part wasn't the overall ranking. It was turning a vague feeling about the design into specific things to investigate, fix and review. This isn't about search-engine rankings, and the number isn't a measurement of how good anyone's writing is.

## The Comparison

**[Open the Engineering Blog Design Atlas gist](https://gist.github.com/RehanSaeed/4f84c3d51b8c7bcfcdb809422d0ec470)** to see the report and its underlying JSON and CSV data.

GitHub displays the HTML source rather than running the report. Download `blog-design-atlas-gist.html` from the gist, then open the downloaded file in your browser to use the interactive comparison. This compact edition of the original single-review report omits the screenshots; it contains all 51 sites and 510 category ratings. The gist is unlisted, not private: anyone with the link can read it.

The final sample was 50 curated, influential engineers' blogs, plus mine as the 51st comparator. It wasn't an objective list of the internet's 50 most popular engineers, a census of competing blogs or a universal league table.

That distinction matters. Choose only elaborate portfolio sites and you'll probably conclude that you need more animation. Choose only stripped-back journals and you'll probably conclude that you need less of everything. Neither answers whether readers can find and comfortably read your posts.

For another app, I'd start with a smaller set of peers that serve similar readers and tasks, including a few deliberately different approaches. Compare the decisions, not the authors' fame.

## Give the AI a Rubric Before It Gives You a Number

The report used ten categories, each scored from 0 to 100 and weighted equally. Here is the original single-review baseline for my blog:

| Category                          |    Score |
| --------------------------------- | -------: |
| Typography and readability        |       85 |
| Layout, spacing and hierarchy     |       74 |
| Colour and visual contrast        |       80 |
| Identity and art direction        |       91 |
| Navigation and discovery          |       76 |
| Article, code and media           |       83 |
| Narrow-screen design              |       70 |
| Interaction and polish            |       71 |
| Observable accessibility          |       77 |
| Consistency and detail            |       82 |
| **Equally weighted overall mean** | **78.9** |

The rubric had anchors: 50 meant serviceable with notable compromises, 70 meant good with identifiable weaknesses, 85 meant excellent with only minor weaknesses, and 95 meant exceptional within the observed sample. That gives the reviewer something more concrete than "this one feels like an 87".

The weights are still a choice. Giving art direction the same weight as navigation reflects this particular exercise, not a law of software design. A banking app and a personal blog should not necessarily have the same priorities.

That original pass had one AI-assisted reviewer, not a panel. The report describes roughly plus or minus five points of editorial uncertainty, **not a measured statistical confidence interval**. The decimal comes from averaging ten scores; it doesn't make the judgement scientific. I wouldn't read a one-place difference between two blogs as a meaningful verdict.

## Get More Than One Opinion

I then asked three different AI models to score the blogs using the same evidence and rubric, keeping each model's scores before averaging them. Here is how they rated mine on 16 November 2026:

| Reviewer          | Overall score | Rank in the sample |
| ----------------- | ------------: | -----------------: |
| Claude Sonnet 5.5 |          78.4 |              12/51 |
| GPT-6.1 Sol       |          79.8 |              24/51 |
| Grok 4.7          |          80.6 |              16/51 |
| **Panel mean**    |      **79.6** |          **16/51** |

These are ranks within a deliberately chosen sample, not the population of engineering blogs. The ranks use unrounded scores, so displayed ties needn't have the same position. GPT's configured model is confirmed by its task invocation; its returned JSON did not identify the model itself.

**[Read the complete three-model results and provenance](https://gist.github.com/RehanSaeed/c8629bd87dbd3859fd3a67e888322af6)** for every site's individual model scores, categories and panel average. This separate JSON gist is the panel dataset; the interactive HTML gist above remains the historical single-review report. Both gists are unlisted, not private.

The category breakdown makes the disagreement more useful:

| Category                      | Claude | GPT | Grok | Panel mean |
| ----------------------------- | -----: | --: | ---: | ---------: |
| Typography and readability    |     78 |  82 |   82 |       80.7 |
| Layout, spacing and hierarchy |     78 |  76 |   74 |       76.0 |
| Colour and visual contrast    |     80 |  84 |   84 |       82.7 |
| Identity and art direction    |     86 |  89 |   88 |       87.7 |
| Navigation and discovery      |     80 |  66 |   80 |       75.3 |
| Article, code and media       |     78 |  81 |   78 |       79.0 |
| Narrow-screen design          |     76 |  79 |   82 |       79.0 |
| Interaction and polish        |     76 |  78 |   80 |       78.0 |
| Observable accessibility      |     72 |  81 |   78 |       77.0 |
| Consistency and detail        |     80 |  82 |   80 |       80.7 |

For each blog, I averaged each category across the three models with equal weight, then averaged those ten category means. Calculations retain unrounded values and round only for display. With complete reviews and equal weights, that's also the mean of the models' overall scores: `(78.4 + 79.8 + 80.6) / 3 = 79.6`.

Navigation is an obvious place to look more closely: GPT gave it 66 while both other models gave it 80. An average should expose that disagreement, not tidy it away.

The final runs used the same corrected evidence package and rubric. The prompts and package excluded earlier numeric scores, my numeric target and other reviewers' reports. This was a **same-evidence, prior-score/target-blind panel**, not an identity-blind audit: the selection labelled mine "Your blog". Earlier attempts with unequal evidence coverage or incorrectly labelled views were discarded.

All three reviewed identical image composites representing the five capture views for each site, rather than opening the original captures separately. For 47 sites, a four-view sheet was paired with an article-top desktop capture. Four sites used their separate source captures within the composites, with two sites sharing one sheet. Downscaling limits fine text and code; some labels overlap. No external browsing was used. The final Grok run reported opening no earlier review files, although filenames and checkpoint titles were visible in its broader context.

That means this panel did **not** test live interactions, DOM semantics, assistive technology, physical devices, numerical contrast, WCAG conformance or performance. The accessibility column is a limited visual judgement, not an audit. "Three AI reviewers agreed" is not a substitute for checking whether a button actually works.

If a model cannot assess a category, the panel result is incomplete. Don't quietly drop that model, count the missing score as zero or publish a complete-looking average from a different panel.

Different models still share training material and can make similar mistakes. Their average isn't a user study, a confidence interval or proof that the majority is right. The original 78.9 and this 79.6 are separate reviews of the historical evidence, **not a before-and-after improvement**. That comparison is post hoc; the earlier score wasn't an input to the final panel. I'd capture the changed app and reassess it with this same panel before claiming progress.

## Make It Look at the Actual App

The evidence was collected on 15–16 November 2026. Each site had a public index and one representative article inspected at a 1440 × 1000 desktop viewport and a 390 × 844 narrow viewport, plus an article-body capture. Five captures per site meant 255 real captures across the 51 sites.

Light colour scheme and reduced motion were requested. The review also sampled a Tab target, a link hover and limited DOM facts. That is useful evidence, but it isn't a physical-phone test, a performance audit or a formal accessibility assessment. One article doesn't represent every page on a blog either.

The first attempt had browser failures and was marked incomplete. Working browser tooling later allowed the review to finish all 51. That's preferable to an impressive-looking table filled with guesses.

Here's a reusable prompt I'd use for a similar exercise, rather than a transcript of the original request:

```text
Compare my app with these peer URLs for the same primary task.
Agree the category definitions, score anchors and weights before rating.
Have each named model independently assess the same evidence, without
seeing the other models' scores or the desired result.

Inspect the same index and representative content page at fixed desktop
and narrow viewports. Save final URLs, dates and rendered evidence.
Check a keyboard path and relevant interactions, not just screenshots.

For each category, return a score, a specific observed rationale and
the evidence supporting it. Record the actual model ID and review date.
Separate observation from inference. Retain every model's scores and
show their equal-weight averages only when the panel is complete.
Mark unavailable evidence as unknown; never invent a score or count
an unknown as zero. Don't calculate a full total with missing categories.

State the limits of the sample. Do not infer accessibility compliance,
performance or real-device behaviour from how a screenshot looks.
```

I also want structured data, not just a long chat response. Keep category IDs, scores, rationales and evidence references together in JSON, then build the HTML comparison from that data. Check the totals and missing values before worrying about how attractive the report looks.

An interactive report makes it easier to compare a few peers in the category you're actually working on. A sortable overall score is tempting, but "how do these sites help me discover an article?" is a much more useful question than "who won?"

## Don't Redesign the Bit That Already Works

In the original review, my strongest categories were identity at 91 and typography at 85. The blog already had a recognisable look and generous reading text. The weakest areas were narrow-screen design, interaction polish and layout. The later panel also rated identity highest, but put navigation and layout lowest: another reason to investigate observations rather than treat category numbers as objective facts.

That suggests preserving the identity, not asking an agent to replace it with whatever design currently appears most often in its training data. I've already got [opinions about CSS](/css-general-rules-of-thumb/). I'd quite like the result to remain my blog.

The review pointed to a few actionable issues:

- The large author header dominated the homepage's first view and delayed discovering posts.
- A narrow article view showed slight horizontal overflow.
- The focused skip link overlapped the top navigation.
- The sampled article had two `h1` elements, which needed investigation rather than an automatic heading replacement.

These are starting points for engineering work, not instructions to apply a screenshot review blindly.

Source and rendering checks traced the overflow to decorative waves using `100vw`. At the nominal 390-pixel viewport, the document's available `clientWidth` was 375 pixels with a classic scrollbar; article content extended to 383 pixels. That is eight pixels of actual overflow. Comparing `scrollWidth` only with `window.innerWidth` would have missed it.

The answer isn't to put `overflow: hidden` on the whole page and hide the evidence. Find the element causing the overflow and correct its sizing without clipping useful content or focus indicators.

Further checks found the search and theme controls collapsing at 320 pixels. The extra article `h1` came from the footer's author component, suggesting a semantic heading variant that preserves its visual size. And the skip link's native Enter behaviour already focused the main content correctly: its overlapping presentation needed attention, not a replacement keyboard handler.

That last distinction is important. A suspicious screenshot is not proof that the underlying interaction is broken.

## Turn Findings into Focused Agent Tasks

I asked for 83 overall. From 78.9, that would require 41 additional category points in aggregate across the ten equally weighted categories. It's a way to think about the size of the target, not a forecast or a promise.

The findings became separate implementation scopes: a reading-first homepage, and responsive and accessibility fixes. The [responsive and accessibility fixes](https://github.com/RehanSaeed/rehansaeed.github.io/pull/1498) have now merged; the [reading-first homepage](https://github.com/RehanSaeed/rehansaeed.github.io/pull/1497) is still under review. **There is no verified post-change score of 83.**

Instead of giving an agent only the target number, I'd give it a bounded task like this:

```text
Investigate the article's horizontal overflow and narrow navigation.
First reproduce each issue in the current app and identify its cause.
Preserve the existing brand, typography and native keyboard behaviour.

At 320px and 390px, the page must not scroll horizontally because of
decorative content, and search/theme controls must remain reachable.
Code blocks may scroll inside their own containers where necessary.
At 1440px, preserve the intended desktop layout.

Add focused regression tests. Check keyboard focus, light/dark themes,
forced colours and zoom/reflow. Report checks you could not perform.
Do not hide page overflow globally, weaken tests or change the rubric.
Return a focused PR with before/after evidence for human review.
```

The acceptance criteria describe things a reader can experience. They don't say "convince the reviewer that mobile is now 85".

For the homepage, the equivalent goal is to make post discovery more immediate while retaining the author identity. A before/after capture at the same viewport can show whether post links are actually easier to find. It can't, by itself, prove that more people will read them.

Separate agents are useful when the scopes can stay independent. Shared components and CSS still need coordination, and their combined result needs checking. Generating two plausible PRs is not the same as delivering one coherent app.

## Don't Let the Score Become the Product

This is a fairly direct invitation to Goodhart's law: once the score becomes the target, it can stop being a useful measure.

An agent might add decoration because it thinks the reviewer likes it, hide a troublesome control, or keep asking for a reassessment until it gets the desired answer. None of those necessarily helps a reader.

Self-grading is another problem. Reusing the same reviewers helps keep the comparison consistent, but it also reuses their preferences and blind spots. Showing them the old score and the desired 83 can anchor the next judgement. Asking an agent to grade its own implementation adds another reason to be cautious.

I'd keep the original evidence and rubric fixed, capture the changed app using the same protocol, and ask for fresh scores and rationales without showing the previous scores or target first. Compare with the baseline afterwards. An independent reviewer, ideally including people who actually use the app, is a useful additional check. If a category falls or stays unchanged, keep that result.

Accessibility especially cannot be traded away in an average. An attractive colour palette doesn't compensate for an unreachable button. The report's "observable accessibility" category is a limited signal, not a conformance claim. Checks such as [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) and [keeping keyboard focus visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) need their own verification, alongside appropriate assistive-technology testing.

Keep the existing build, lint, type and browser checks too. A more flattering design score is not permission to weaken them.

## The Useful Output Is a Better App

The loop I'd repeat is: choose relevant peers, agree a rubric, collect rendered evidence, compare specific decisions, verify weaknesses, give agents focused tasks, then reassess the actual result.

The comparison has already helped turn "make my blog better" into concrete work: bring reading closer to the front, fix real overflow and make controls easier to use without throwing away the design.

Whether those changes deserve 83 is still an open question. The more important test is whether readers can find a post, read it comfortably and use the site without fighting the interface. The number should help me decide what to inspect next, not tell me when to stop thinking.
