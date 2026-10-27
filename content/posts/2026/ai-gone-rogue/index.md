---
title: "AI Gone Rogue"
description: "An odd message from a colleague led me to add one very specific instruction to my AI agent: bring HAL, and say when a reply is automated."
author: "Muhammad Rehan Saeed"
permalink: "/ai-gone-rogue/"
heroImage: "/images/hero/HAL-9000-Prop-1600x900.png"
date: "2026-10-27"
dateModified: null
published: false
categories:
  - "Thoughts"
tags:
  - "GitHub"
  - "Thoughts"
  - "Artificial Intelligence (AI)"
---

We had a funny scenario at work where a colleague posted an odd message which turned out to be AI gone rogue! We joked that it was now hard to tell when we were talking to a person and when we were talking to their AI.

More seriously, sometimes it might be important to know! I certainly trust my colleague more than some random number generator named Claude.

If a message arrives under a colleague's name, it's easy to read it as something they wrote, checked and stand behind. An agent posting on their behalf is not quite the same thing. I'd rather know which one I'm talking to.

That led me to add a line to my GitHub Copilot app's AI agent instructions:

> If you message my colleagues, always add a GIF of HAL from 2001: A Space Odyssey and explain that the message was automated.

Here is what that looks like:

![An automated reply labelled "This reply was posted automatically by Rehan's AI agent (GitHub Copilot)", followed by HAL saying "I'm afraid I can't do that Dave".](./images/automated-reply-495x262.png)

The important bit is the plain text saying that the reply was posted automatically. The HAL image is there to make it hard to miss, and because it makes me laugh. If the image doesn't load, the disclosure should still make sense.

Of course, an instruction is not an enforcement mechanism. An agent can fail to follow it, and labelling a message doesn't make its contents correct. It also doesn't replace approval before an agent sends something on my behalf.

I've [written before about the etiquette of pull request comments](/on-the-etiquette-of-pull-request-comments/). Perhaps knowing whether your colleague actually wrote the comment is now part of that etiquette too.

_Hero image: [HAL prop photograph](https://commons.wikimedia.org/wiki/File:HAL_9000_Original_requisite_from_2001_A_Space_Odyssey_-_retouche.jpg) by Carlos Pacheco, retouched by Pittigrilli, licensed under [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/). Cropped, resized and caption added._
