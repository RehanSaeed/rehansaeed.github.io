---
title: "Stop The Brace Wars, Use StyleCop"
description: "StyleCop analyzes C# source code to enforce a set of style and consistency rules. Rehan advocates its use in this thought provoking article."
author: "Muhammad Rehan Saeed"
permalink: "/stop-brace-wars-use-stylecop/"
cover_image: "./images/StyleCop.png"
date: "2014-02-08"
published: true
categories:
  - "Tools"
tags:
  - "C#"
  - "standards"
  - "StyleCop"
---

There is an on-going war among developers. This silent war has claimed countless hours of developer time through hours wasted in pointless meetings and millions of small skirmishes over the style of each developers written code. This post outlines a peace treaty, a way forward if you will but first I will outline the problem.

# Unverscores Versus the 'this' Keyword

This is the main battlefront where most time is wasted and where developers are most entrenched in their forward positions. To use underscores for your field names or the `this` keyword. I myself am in this `this` camp but neither has a clear advantage in the battlefield. The underscores make it marginally quicker to access your fields using intelli-sense, while the `this` keyword makes it quicker to differentiate class members from static members.

```cs
private int _property;

public int Property
{
    get { return _property; }
}
```

```cs
private int property;

public int Property
{
    get { return this.property; }
}
```

# The Brace War

This lesser known conflict is where JavaScript styling has leaked into C#. The default formatting rules in visual studio usually quashes this conflict but there are still those who see white space as wasted space and will go the extra mile by changing the Visual Studio settings to 'fix' this problem. I personally stick to the defaults and find the other method hard to read, a small sacrifice of a few extra lines is worth the gain in readability.

```cs
public int Property
{
    get { return this.property; }
}
```

```cs
public int Property {
    get { return this.property; }
}
```

# Field, Property, Constructor and Method Ordering

Some (like me), like to have all fields, properties, constructors and methods separated into their own groups. Others prefer fields grouped with properties, and members from implemented interfaces kept together. Again, there is no real right way, the former allows quick navigation to find what you need, while the latter allows quick navigation of members which relate to each other.

# Using Statements Inside or Outside the Namespace

Here is one area where there is a clear advantage in one camp. As outlined in this [Stack Overflow post](http://stackoverflow.com/questions/125319/should-usings-be-inside-or-outside-the-namespace), adding using statements inside the namespace can sometimes save a few seconds of troubleshooting. Yet even here, Visual Studio lets us down by having using statements outside the namespace as the default.

# Stepping on Peoples Feet

Looking at another developers code can be an interesting experience. The style, look and feel of any code can vary wildly, even if they are written in the same language. Many times, I have found it difficult to find what I'm looking for and it takes time to adjust to each unique style.

Many a time, these large differences can occur even in the same teams, reducing productivity. This leads to the inevitable 'standards' meetings, where a teams of developers sit in a room and discuss underscores versus `this` and other differences at length. My own experience is that each side is entrenched and hunkering down into their positions, not wanting to have to change their writing style. In the end, the majority wins out or people continue working in their own way and people get used to it.

# The Solution For Peace

I would argue that as there is no clear superior coding style, it is a pointless waste of time arguing over it. However, there is something to be said for a commons coding style. This is where [StyleCop](http://stylecop.codeplex.com/) comes in. It is a set of style rules which can be applied to your C# code.

There need be no lengthy discussion or arguing over it. Keep the default rules (turn off the comment rules if you choose) and you quickly have a set of standards that can be universally applied and tested not just in your team but universally by all C# developers around the world.

Download some sample code from [GitHub](https://github.com) and be at ease at the familiar look to the hopefully well designed code. I paint a rosy picture but I see more and more developers using StyleCop. It takes a week to get used to the change in your writing style, I myself switched from underscores to `this` and have never looked back. You can too.
