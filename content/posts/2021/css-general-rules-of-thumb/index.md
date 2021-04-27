---
title: "CSS General Rules of Thumb"
description: "Getting to grips with CSS is difficult. This post describes some general rules of thumb that can guide you down the right path to success."
author: "Muhammad Rehan Saeed"
permalink: "/css-general-rules-of-thumb/"
heroImage: "/images/hero/CSS-1600x900.png"
date: "2021-04-20T12:24:00Z"
dateModified: null
published: true
categories:
    - "CSS"
tags:
    - "CSS"
    - "Accessibility"
    - "Block Element Modifier (BEM)"
---

Learning CSS is difficult and as someone who has tried to teach CSS others, it's also difficult to point to good teaching resources. There isn't a simple video course I can point to and say "go and watch this". I think part of the problem is that there are so many ways to do things in CSS and also that there are so many little tricks you have to learn. As yet, the best advice I've been able to give is to go and read the last few years worth of [CSS Tricks](https://css-tricks.com/) blog posts but that isn't really an easy or quick task or even one that most people would do.

In this post, I wanted to give some super simple general rules of thumb that developers who are new to CSS can follow and get pretty far fairly quickly. I also wanted a public resource I could point to when I was reviewing CSS in pull requests. As these are rules of thumb, they won't be applicable everywhere but they should work in the general case.

# Standards

There are lots of ways of doing things in CSS. Here are some friendly defaults that make a good start.

## Block Element Modifier (BEM)

You should add CSS classes to any HTML elements you want to add CSS styles to. This means coming up with a naming convention for these CSS class names. [Block Element Modifier (BEM)](https://css-tricks.com/bem-101/) is a great naming convention to get you started. It's worth noting that there are many conventions out there, the key is to pick one and stay consistent.

```css
/* Block component */
.button {
}

/* Element that depends upon the block */
.button__price {
}

/* Modifier that changes the style of the block */
.button--orange {
}
.button--big {
}
```

## CSS Code Style

Keeping your CSS organised can help make reading it easier for yourself and others. Code style is a very subjective topic and everyone has their own opinions. I talk more about this [here](/system-for-grouping-and-sorting-css-properties/).

# Layout

I find that people have a lot of trouble laying out content the way they want. This is a huge topic but here are some basic things I found useful.

## HTML

If your HTML isn't great, you are going to have a tough time with your CSS. This is usually because there are lots of extra `div` or `span` elements that you don't need. Get your HTML right first and avoid adding HTML elements just to get the layout right.

It's also a good idea to learn about [Semantic HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Element). Every HTML tag has a meaning for search engines and those who use assistive technologies like screen readers to navigate the web (there are more people using these than you think).

## Grid vs FlexBox

As a general rule [CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/) can cater to 80% of your layout needs, so learn it well. In particular pay close attention to `grid-template-areas` which is a little more verbose to setup but makes your CSS Grid layout much easier to read and makes it more flexible because changing the layout means only changing the CSS for the container instead of each and every child of the container.

When you want to wrap content [CSS FlexBox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) has your back.

## Display Block vs Inline

Understanding the different [display modes](https://css-tricks.com/almanac/properties/d/display/) (`inline`, `block`, `inline-block`, `grid`, `flex`, etc.) is a must. In particular pay attention to the first two because they are the default for a lot of HTML elements.

If your element is hugging the top instead of taking all the available space, it's probably because it's using `display: block` and your good friend `display: grid` will fix that for you.

## Heights and Widths

Get your hands away from the keyboard and put them down very slowly. If you are setting `height` and `width`, it's usually the wrong thing to do and makes your layout brittle and unwilling to flex.

Rather than explicitly setting a size, try to allow the contents of the container to set the size for you. This means changing the way you think about layout. In general there is an ordering to the CSS properties you should use for sizing your elements:

1. `auto-fit`/`auto-fill` and `minmax()` - Used in conjunction with CSS Grid's `grid-template-columns`, these will allow your grid to become responsive.
2. `grid-gap` or `gap` (in newer browsers) - Used with CSS Grid and FlexBox (only supports `gap`). This allows you to add spacing between elements in your container.
3. `padding` - It's generally preferable to use CSS properties that only affect the current element as opposed to the parent elements like `margin` does.
4. `margin`
5. `min-height`/`max-height` and `min-width`/`max-width`
6. `height` and `width` - Use this with care if you really know what you're doing.

# Browser Support

The web is a wild west, there are many features in CSS which have varying degrees of support in different browsers and the many different versions of each browser. Whenever you're considering using a new CSS feature you found online, it's a good idea to search on [caniuse.com](https://caniuse.com/) to see if it's supported in the web browsers you want to target for your application.

# Colours

A colour in CSS can be written in several ways. Below, I'm setting the colour white in a few different ways. You should prefer `hsl` because it's easiest for a human to understand how it works.

```css
color: white;
color: #ffffff;
color: rgb(255, 255, 255);
color: hsl(0, 0%, 100%);
```

# Accessibility

Making your web application accessible is a must, lets talk about how.

## Accessible HTML

I've talked about HTML before but I'll repeat it here because it's so important. You must learn [Semantic HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Element) and get your HTML right before thinking about the CSS.

## Outline

Never set the `outline` on a focusable element to `none`. People need those outlines to see what they've focused on.

```css
.foo {
    outline: none;
}
```

## Accessible Colours

Ensure that the `background-color` and `color` you've chosen are accessible. It's pretty easy to to do and you can read more [here](https://css-tricks.com/understanding-web-accessibility-color-contrast-guidelines-and-ratios/).

# Closing Thoughts

CSS seems on the face of it to be a simple programming language (and yes it is one) but it has a lot of depth to it once you start using it. If you want to learn more, reading the [CSS Tricks](https://css-tricks.com/) blog posts are a great way to learn, there are also some decent courses on [Frontend Masters](https://frontendmasters.com/) although you do have to pay to view those.
