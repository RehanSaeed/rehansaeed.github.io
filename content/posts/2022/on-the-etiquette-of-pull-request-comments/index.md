---
title: "On the Etiquette of Pull Request Comments"
description: "Commenting on a pull request is fraught with potential pitfalls. Here is a short guide to the etiquette of writing pull request comments."
author: "Muhammad Rehan Saeed"
permalink: "/on-the-etiquette-of-pull-request-comments/"
heroImage: "/images/hero/Precious-PR-1600x900.jpg"
date: "2022-02-07"
dateModified: null
published: true
categories:
  - "Thoughts"
tags:
  - "Pull Request (PR)"
  - "Thoughts"
---

Picture the scene. A hard working newbie developer is mashing their keyboard for hours trying to get something working smoothly. Eventually, perseverance and maybe more than a little help from StackOverflow leads to success. The developer carefully commits their code and crafts a pull request, ready for the world to bask in its glory.

The next day the developer eagerly opens up their pull request and sees a dozen or so comments that all look something like this:

> nit: Fix this.
>
> <footer><cite>Reviewer</cite></footer>

You may see this comment and not see any problems. I'd like to suggest that this comment is an example of somewhat bad etiquette. Let us discuss the etiquette of pull request comments.

# Being Short

I have a limited number of [keystrokes before I die](https://www.keysleft.com). Are my fellow developers not worthy of a share of those strokes? We're all in a rush to get something done but spending the time to write a full comment is not a waste of time, it shows that **you care**!

> Fix this.
>
> <footer><cite>Reviewer</cite></footer>

What needs to be fixed? How does it need to be fixed? Why does it need to be fixed? Answering the what, why and how is important to getting your point across.

In cases like this, saving yourself some keystrokes by assuming knowledge on the part of the developer submitting the PR is often a mistake. By not fully explaining yourself, you increase the chances of further questions being asked or even direct contact via messaging systems like Slack or Microsoft Teams. Since PR reviews are asynchronous in nature, this can increase the time it takes to review a PR by hours or even days.

# Code Style

If you're writing pull request comments that are about code style, consider using a tool like [StyleCop](/stop-brace-wars-use-stylecop/) or Prettier to automate this. It also ends any conflict in a team about the style of code the team should adopt and makes everyone's code look the same for optimal readability. Thus you can avoid having comments like this in your pull requests:

> Prefix your fields with `_`.
>
> <footer><cite>Reviewer</cite></footer>

# Jargon

The first time I saw 'nit:' in a PR review, I had to google its meaning. Evidently, it means that the comment is a minor point by evoking the spectre of a [blood sucking parasite](https://en.wikipedia.org/wiki/Head_louse). It saves the writer around seven keystrokes but always evokes a mild sense of disgust in me personally. Why not save someone doing that Google search and disgust and just write 'Minor point:'?

> nit: This can be done better.
>
> <footer><cite>Reviewer</cite></footer>

# Passive Aggressive

The way you word your PR comments can come across as passive aggressive if you're not careful. Is the commenter below suggesting that I hadn't considered the use of 'X'? What if I already did and discounted it?

> Use X here.
>
> <footer><cite>Reviewer</cite></footer>

Below are a couple of better ways to phrase the above comment. The comments assume nothing about the developers intent and simply ask a question.

> Have you considered doing X here?
> Have you thought about X?
> Would X help here?
>
> <footer><cite>Reviewer</cite></footer>

# Emote 😆

Text is an imperfect low bandwidth means of communication. One way to increase that bandwidth is to use emoji and get an emotional point across along with your technical one. It also gets across a sense of fun to what can come across as something quite negative, since you are after all picking out all the mistakes you can spot in someone's hard work.

> Looks like there is a 🐛 crawling on this line.
>
> <footer><cite>Reviewer</cite></footer>

# Positive Comments

Not every comment has to be a negative comment picking out a bug or mistake. It's useful to call out a positive change. Other reviewers in the team may see it and pick up on the practice too.

> 🚀 This is awesome, we need to do this elsewhere.
>
> <footer><cite>Reviewer</cite></footer>

# Bring Evidence

I sometimes see comments to the effect of the one below. Why is 'X' better? Says who?

> X is a better way to do this.
>
> <footer><cite>Reviewer</cite></footer>

Now imagine there was a link below to a blog post providing evidence as to why 'X' is better. We'll even use better language and the odd emoji:

> Have you considered using X, it's 🔥?
>
> 🔗 https://rehansaeed.com/why-x-is-better-than-y
>
> <footer><cite>Reviewer</cite></footer>

# Teachable Moments

Every PR comment is a teachable moment where you have the opportunity to take a little extra time and explain why you are requesting a particular change. As I've said above, take the time to add a link to a relevant article or blog post but I've found that sometimes writing a paragraph or two can also help.

One thing to watch out for though is that PR comments **don't scale**! If you find yourself making the same comment on a second persons PR, it's time to think about writing a blog post (as I've done in the past), wiki entry or some documentation somewhere and sharing that with your team.
