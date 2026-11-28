---
title: "Coding isn't the bottleneck anymore. So what is?"
description: "My thoughts on what slows AI-assisted development: feedback loops, linting, PR reviews, tooling, product decisions and coordinating agents."
author: "Muhammad Rehan Saeed"
permalink: "/coding-isnt-the-bottleneck-anymore-so-what-is/"
heroImage: "/images/hero/AI-Agents-Upgrading-a-Blog-With-Human-Code-Review-1600x900.png"
date: "2026-11-10"
dateModified: null
published: false
categories:
  - "Thoughts"
tags:
  - "Artificial Intelligence (AI)"
  - "GitHub Copilot"
---

My manager asked the question in the title of this post. Here are my thoughts.

## Slow Inner Dev Loop

Every step in the inner development loop is slow, so every agent has to wait:

1. Git clone/new worktree (🐌🐌🐌🐌🐌)
2. `yarn fast` (🐌🐌🐌🐌)
3. `yarn lint` (🐌🐌)
4. `yarn test` (🐌🐌🐌)
5. `yarn start` (🐌🐌)
6. Test the change, then go back to step 1 and iterate. (🐌🐌)
7. Push PR. (🐌)
8. Wait for the PR build. (🐌🐌🐌🐌🐌)
9. Watch the PR, then go back to step 1 and iterate until completion. (🐌🐌🐌🐌🐌)

In the huge monorepo I've been working in, this loop is painfully slow. Having worked on two small to medium-sized apps ([my blog](/ai-learnings-from-upgrading-my-blog/) and a desktop app) with [GitHub Copilot](https://github.com/features/copilot), a tight inner loop is crucial.

When it started to get slow, I got an agent to make it fast again. If I saved one minute in build time, that scaled across ten agents I had running at any one time, each building multiple times. That could save 20 minutes or more of cumulative build time.

## Poor Linting

Catching a problem early can stop you having to go through the entire development loop above. Good linting saved me a lot of time when experimenting on my personal projects during my holidays. I've [written about turning up the linting dials](/ai-learnings-from-upgrading-my-blog/#turn-linting-to-the-max) before; it matters even more when several agents are writing code at once.

## PR Comments

These arrive very late in the development loop. Where a comment comes from an automated check, I'd rather give the agent instructions to run that check locally so it can fix the issue early.

For feedback that needs judgement rather than a check, [the conversation still matters](/on-the-etiquette-of-pull-request-comments/). But repeating the same feedback on every PR is a good reason to put it in the agent's instructions.

## PR Reviews

I'm still having to wait for people to review PRs in some repositories. There are efforts to remove the need for human eyes entirely for simple PRs, but we are not there yet.

## 🙋🏼‍♂️ Me

I still review PRs. There may come a day when that is not necessary, but it's not today.

## Tooling

Not everyone is using what I think is the optimal setup: GitHub Copilot and [Codespaces](https://github.com/features/codespaces).

## Product Oversight and Communication Between Teams

There always seem to be several teams building slight variations of the same feature, treading on each other's toes and resulting in a worse experience for the user.

Different stakeholders and goals can leave teams doing their own thing, without anyone connecting the work into a coherent product. The result is overlapping experiences and work that has to be redone. Writing the code faster doesn't fix that.

## Chasing Competitors Instead of Innovating

Reacting to competitors' features and demanding the same thing immediately is another bottleneck. I'd rather we made deliberate product decisions than kept changing direction to match someone else's latest release.

Even when there's something ahead of the game, sitting on it instead of getting it into users' hands can waste that lead. Faster coding doesn't help much if the product decision is what we're waiting for.

## GitHub Copilot Projects

Often, PRs touch the same code and require some coordination to get into the main branch. I did this manually until I switched to the GitHub Copilot app's new Projects feature, which carries out that coordination for me.
