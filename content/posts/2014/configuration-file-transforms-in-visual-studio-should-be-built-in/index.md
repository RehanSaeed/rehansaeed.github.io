---
title: "Configuration File Transforms In Visual Studio Should Be Built In"
description: "Configuration File Transforms can be done with the Slow Cheetah Visual Studio extension by Sayed Hashimi. This feature should be built into Visual Studio."
author: "Muhammad Rehan Saeed"
permalink: "/configuration-file-transforms-in-visual-studio-should-be-built-in/"
heroImage: "/images/hero/Visual-Studio-1366x768.png"
date: "2014-12-15"
dateModified: null
published: true
categories:
  - "Visual Studio"
tags:
  - "App.config"
  - "Config"
  - "Configuration"
  - "Microsoft"
  - "Sayed Ibrahim Hashimi"
  - "Slow Cheetah"
  - "Visual Studio"
  - "Web.config"
---

::: tip Update 1
I should point out that configuration file transforms have been available for some time for web projects **only**. I believe the feature was developed by the web team within Microsoft. This fact just makes it more strange, that this feature was not rolled out to the masses.
:::

::: tip Update 2
Microsoft has just announced on their [UserVoice](http://visualstudio.uservoice.com/forums/121579-visual-studio/suggestions/2043217-support-web-config-style-transforms-on-any-file-in) site that SlowCheetah will be updated for Visual Studio 2015 and future versions will indeed have configuration file transforms built in! That's great news and shows another example of Microsoft listening to its developers.
:::

# Introduction

I have used a number of IDE's in my time as a developer, from bare bones text editors like [Sublime](http://www.sublimetext.com/) (Which you should seriously consider purchasing. It beats the pants off of notepad and most notepad competitors) to fully fledged development environments like [Netbeans](https://netbeans.org/) and Visual Studio. It has to be said though that Microsoft does a much better job than most and packs a lot of power into their punch.

It is with puzzlement and confusion then that something as useful and common as transforms for configuration files (.config) are still not supported by Microsoft. You may be wondering what I'm babbling about. Well, every developer at some point has had to release their application on more than one environment, even if it's just your own development machine and wherever your application is released. In the past I've worked with as many as four distinct environments. Each with it's own application settings, database connection strings and other settings stored in .config files. In the past, this has been a nightmare.

# Slow Cheetah

Happily though, someone named [Sayed Hashimi](https://github.com/sayedihashimi) working for Microsoft has unofficially created a Visual Studio extension called [Slow Cheetah](https://visualstudiogallery.msdn.microsoft.com/69023d00-a4f9-4a34-a6cd-7e854ba318b5). Go ahead, read through, that page if you haven't already, I'm not going to describe the genius that is Slow Cheetah here (I'm not just talking about the ironic name, which I quite like. Sayed Hashimi seems to have a gift for odd names, as he is also a developer for the [Side Waffle](http://sidewaffle.com/) project).

Unfortunately, according to [this](https://github.com/sayedihashimi/slow-cheetah/issues/158) post, Slow Cheetah is no longer going to be supported in future versions of Visual Studio. His reasons for dropping support are interesting. In the first paragraph, he suggests that the existence of Slow Cheetah has stopped Microsoft from building configuration file transforms into Visual Studio in the first place.

# What Now

It's been a few months since Sayed's post on GitHub. While I'm sure the community will step in and keep the tool updated for future versions of Visual Studio, this is really something that should have been built in to Visual Studio years ago!

Don't despair, there is hope. On the [Visual Studio User Voice](http://visualstudio.uservoice.com/forums/121579-visual-studio/suggestions/2043217-support-web-config-style-transforms-on-any-file-in?page=17&per_page=20) site, there is a suggestion to support configuration file transforms out of the box. What's more, is that the suggestion is currently number seven in the list of 'hot' ideas and number three if you remove the ideas that Microsoft have already commented on. Please do go and vote for this suggestion, Microsoft does read and more importantly act on them.

I spent some time a year ago teaching a junior developer the new C# async and await feature, as well as the Task Parallel Library (TPL). Not only did it blow his mind but I realized that so much that I had learned had now become obsolete and that this new developer would never have to struggle with asynchronous code as I had. In my opinion, this feature is another one of those moments when we can consign another series of old method to the dustbin of history. We just need to help Microsoft know about it.
