---
title: "A System for Grouping & Sorting CSS Properties"
description: "Grouping and Sorting CSS properties can make your CSS easier to read and helps with consistency in a team environment. There is no correct answer but something is better than nothing."
author: "Muhammad Rehan Saeed"
permalink: "/system-for-grouping-and-sorting-css-properties/"
heroImage: "/images/hero/CSS-1600x900.png"
date: "2021-04-20"
dateModified: null
published: true
categories:
    - "CSS"
tags:
    - "CSS"
    - "CSS Classes"
    - "standards"
---

There are no hard and fast rules for code style and as I've [written about before](/stop-brace-wars-use-stylecop/) it can get ugly when people have various opposing opinions on the subject. In CSS, which I'm quite fond of writing, I believe the answer is mostly given to us by using [Prettier](https://prettier.io/), the opinionated code formatter. Unfortunately, Prettier does not sort CSS properties for you [and never will](https://github.com/prettier/prettier/issues/1963), so this post is one solution (**not** the correct solution because there is no correct solution).

There are automated tools like [postcss-sorting](https://github.com/hudochenkov/postcss-sorting) that can help with this but I think it'd be difficult to use in real life because there will always be exceptions to the hard coded rules.

But why even bother to group and sort CSS properties? Well, I think it makes sense for two reasons. The first is that it can make it quicker to quickly scan the CSS and find what you need. The second is that if you're working in a team environment, it can make it easier to work on CSS that has one over arching consistent style.

# Grouping CSS Properties

I believe you can split CSS properties into a few groups:

1. Parent layout
2. Layout
3. Box Model
4. Positioning
5. Display

Here is an example of the four groups in real life:

```css
.card {
    // Parent Layout
    grid-area: card;

    // Layout
    display: grid;
    align-items: center;
    gap: 10px;
    grid-template-areas:
        "header header"
        "content content";
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    justify-items: center;

    // Box Model
    box-sizing: border-box;
    width: 100px;
    height: 100px;
    margin: 10px;
    padding: 10px;

    // Positioning
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10;

    // Display
    background-color: red;
    border: 10px solid green;
    color: white;
    font-family: sans-serif;
    font-size: 16px;
    text-align: center;
}
```

## Parent Layout

The parent layout is any CSS layout properties that effect or come from the parent element. This usually boils down to `grid-area` if you're using `grid-template-areas` which you [totally should](https://css-tricks.com/snippets/css/complete-guide-grid/#grid-template-areas) because it allows you to change the layout child elements without modifying the child elements CSS too much.

```css
.card {
    // Parent Layout
    grid-area: card;

    // ...
}
```

## Layout

CSS Layout properties determine how the contents of the CSS class will be layed out. The common case is that you're using CSS Grid or Flexbox and want to group their respective properties together where they make the most sense.

I think it makes the most sense to start with the `display` property because that determines the type of layout followed by other properties in alphabetical order.

```css
.card {
    // ...

    // Layout
    display: grid;
    align-items: center;
    gap: 10px;
    grid-template-areas:
        "header header"
        "content content";
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    justify-items: center;

    // ...
```

## Box Model

CSS properties that affect the box model can come next. Again, I'm using alphabetical order except for `width` and `height` where it makes more sense for them to go together with `width` always being first (there are a lot of exceptions to the rules in CSS).

```css
.card {
    // ...

    // Box Model
    box-sizing: border-box;
    margin: 10px;
    padding: 10px;
    width: 100px;
    height: 100px;

    // ...
```

## Positioning

CSS properties related to `position` come next. Similar to `display`, we put the position at the top and follow in alphabetical order. Again there is an exception to be made here with `top`, `right`, `bottom` and `left` which follow the order that `margin` and `padding` values take.

```css
.card {
    // ...

    // Positioning
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10;

    // ...
```

## Display

Finally, there are CSS display properties which affect the look and feel. This is also a kind of 'Other' category where you can place remaining properties which don't make sense in other groups.

```css
.card {
    // ...

    // Display
    background-color: red;
    border: 10px solid green;
    color: white;
    font-family: sans-serif;
    font-size: 16px;
    text-align: center;
}
```

# Final Comments

This is just one method of grouping and ordering CSS properties that I've found useful in real life projects. There is no correct answer to this problem and I think the problem space is probably too complex to make a tool like Prettier do the work for you because there will always be exceptions to the rules.
