---
title: "AI Learnings from Upgrading My Blog"
description: "Six lessons from migrating my blog from Gridsome to Nuxt with GitHub Copilot, from strict linting and agent instructions to parallel experiments."
author: "Muhammad Rehan Saeed"
permalink: "/ai-learnings-from-upgrading-my-blog/"
heroImage: "/images/hero/AI-Agents-Upgrading-a-Blog-With-Human-Code-Review-1600x900.png"
date: "2026-11-04"
dateModified: null
published: true
categories:
  - "Thoughts"
  - "Web"
tags:
  - "Artificial Intelligence (AI)"
  - "GitHub Copilot"
  - "Nuxt.js"
  - "Vue.js"
  - "Static Site Generator"
---

Last week, while I was on holiday, I spent a few hours upgrading my blog from [Gridsome](https://gridsome.org/) to [Nuxt](https://nuxt.com/) using [GitHub Copilot](https://github.com/features/copilot). Nuxt is the [Vue](https://vuejs.org/) equivalent of Next.js, and I'm a Vue/[Evan You](https://evanyou.me/) fanboy, so the choice wasn't particularly difficult.

I'd [picked Gridsome back in 2020](/choosing-a-static-site-generator/) but unfortunately some time ago now the developer ghosted the community (I don't begrudge that. Life and family happens and what was once a fun side project becomes hard work nobody is paying you for).

This time, moving on also gave me a chance to see how much of a framework migration I could hand over to agents. I was pretty hands-off, but I came away with some useful learnings.

![GitHub Copilot showing the blog upgrade conversation and review tasks beside a live preview of this article.](./images/github-copilot-blog-upgrade-1920x1152.png)

## I'm the Bottleneck

I have too many ideas. The bottleneck is now me reviewing all the code that I tell agents to write.

Using AI agents to review pull requests seems like the obvious next step. I've done a bit of this at Microsoft, writing an AI agent to look for performance bugs by feeding it the last decade of pull requests containing performance fixes. That seemed to work well. As agents become more capable, I expect this kind of specialised reviewer to turn into a more general-purpose PR reviewer.

There are already products doing this, including [GitHub Copilot code review](https://docs.github.com/en/copilot/concepts/agent-capabilities/agent-powered-workflows-and-operations/code-review). I've [written before about the etiquette of pull request comments](/on-the-etiquette-of-pull-request-comments/); now I'm wondering how much of that conversation will be between machines.

At what point do humans stop manually reviewing PRs? At what point does the machine get better at reviewing code than a human? I don't have an answer yet. It certainly hasn't happened yet but it feels close. Generating more code certainly hasn't made the need to check it disappear.

## Turn Linting to The Max

Turning up the dials on automated checks is really important. Enabling [TypeScript's strict mode](https://www.typescriptlang.org/tsconfig/strict.html), using [Prettier](https://prettier.io/) and throwing the kitchen sink worth of [ESLint](https://eslint.org/) plugins at the project.

I wasted a bunch of time repeatedly telling agents to fix things that could have been caught automatically. Get lint-free early in the development lifecycle, before an agent has produced a mountain of code in a style you don't want.

I've been banging this drum since [Stop the Brace Wars, Use StyleCop](/stop-brace-wars-use-stylecop/). It turns out the same argument applies when the person writing the code isn't a person.

## Use AGENTS.md

For the things you can't lint, writing down your preferences in an [AGENTS.md](https://agents.md/) file is really important.

For me, this meant telling agents to use the [Vue Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) and [Block Element Modifier (BEM)](/css-general-rules-of-thumb/#block-element-modifier-bem) for CSS class names. Some of these preferences can be partially enforced by tooling, but the instructions still help explain the intended approach.

I have strong opinions about things like [CSS conventions](/css-general-rules-of-thumb/) and [how to group and sort CSS properties](/system-for-grouping-and-sorting-css-properties/). Writing those down once is much better than repeating them in every prompt.

The same applies to [how an agent communicates on my behalf](/ai-gone-rogue/). If a preference matters, don't leave the agent to guess it.

Reader beware, adding too much in AGENTS.md can bloat the context and produce worse results. You must strike a balance, be concise but not too prescriptive either.

## Automate Updates

Having a scheduled task to update npm packages and GitHub Actions dependencies is awesome. It's the same appeal that led me to [automate .NET security updates](/automating-dotnet-security-updates/) with Dependabot.

With AI agents though we can take it one step further, we can tell agents to read the release notes and tell you about new features in the updated packages that you should consider implementing.

Breaking changes, tests and review still matter. The useful extra is having the agent explain what the update makes possible, rather than just changing a number.

## Read the Docs

Telling an agent to go and read a package's documentation is a cool way to squeeze more out of something you've already installed. For example:

> Read the [Nuxt PWA module documentation](https://vite-pwa-org.netlify.app/frameworks/nuxt), compare it with this blog's implementation, and suggest improvements.

It's easy to install a package, get the basic example working and never discover the rest of its features. An agent can help find those gaps. Often they are performance or other improvements that require a few extra steps to setup but worth doing. I'd ask for suggestions first, though, rather than blindly implementing every feature. Not every option belongs on my blog.

## Compare Alternatives

You can tell agents to implement something N different ways and then pick the best implementation. This ends up being a great way to ideate.

I've been trying this with an interactive [About page](/about/). Instead of trying to describe the perfect design up front, I can explore ideas and even give the agent some leeway to go and figure things out on its own.

<div class="post__image-inset">

![A GitHub Copilot session list showing ten About page experiments, including dimensional mosaic, wave interference, kinetic letterpress, ribbon journey and orbital gallery.](./images/about-page-experiments-311x388.png)

</div>

Sometimes, I'm not even sure what I want but want something to look at and try as a jumping off point. The implementations give me something concrete to react to. Picking one is still my job, but it's much easier to decide when I can compare actual alternatives rather than imagine them.

## Agents Surpassing Me

Telling agents to use [Three.js](https://threejs.org/) to build amazing interactive 3D visuals for a page seems to be all the rage at the moment. The agents are very good at it, and I've been testing it out.

<figure>
  <video src="/videos/threeui-demonstration-960x720.mp4" controls playsinline preload="metadata" width="960" height="720" aria-label="ThreeUI demonstration of interactive Three.js components and landing pages">
    <a href="https://x.com/MengTo/status/2090817187900780961/video/1">Watch the ThreeUI demonstration on X.</a>
  </video>
  <figcaption>ThreeUI demonstration by <a href="https://mengto.com/">Meng To</a>. <a href="https://x.com/MengTo/status/2090817187900780961/video/1">Source on X</a>.</figcaption>
</figure>

The problem is that while I've used game engines before, I'm not Three.js-proficient, so this is effectively AI-only software for me. I can judge whether I like the result, but I'm less equipped to judge the implementation or maintain it without help.

That brings me back to the first learning: producing code is getting easier much faster than reviewing it. The upgrade was fun, but figuring out how to keep up with what I've asked the agents to build might be the more interesting problem.

## Currency Converter Pro

I've also been porting my old currency converter UWP (Windows 8.1) app to [WinAppSDK (Windows 11)](https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/). I love the artwork of the different bank notes of the world, so that is front and centre in the app.

![Currency Converter Pro showing US dollar and British pound conversion cards beside a large British twenty-pound banknote.](./images/currency-converter-pro-conversion-1999x1124.png)

![Currency Converter Pro's currency picker showing a grid of banknote artwork, flags, currency names and codes from around the world.](./images/currency-converter-pro-currencies-1999x1124.png)

I would not have been able to do any of this without AI! I have kids and a life and have not had the time to do all this until now.

## I'm Not The Only One!

I'm not the only one porting huge amounts of code in GitHub Copilot, the amazing [Stephen Toub](https://devblogs.microsoft.com/dotnet/author/toub/) has been doing the same but using Rust. He talks at length about his experience in the video below that I highly recommend watching:

https://www.youtube.com/watch?v=PLMOVlZC4eU
