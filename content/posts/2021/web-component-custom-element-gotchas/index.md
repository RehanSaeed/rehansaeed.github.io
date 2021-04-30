---
title: "Web Component Custom Element Gotchas"
description: ""
author: "Muhammad Rehan Saeed"
permalink: "/web-component-custom-element-gotchas/"
heroImage: "/images/hero/Web-Components-1600x900.png"
date: "2021-04-30T12:12:00Z"
dateModified: null
published: true
categories:
    - "Web Components"
tags:
    - "Web Components"
    - "HTML"
    - "CSS"
---

Recently I've been writing web components and found several gotchas that make working with them, that much more difficult. In this post, I'll describe some gotchas you can experience when using web components.

This post is framework agnostic but I've been using a lightweight library called [FAST Element](https://www.fast.design/docs/fast-element/getting-started) built by Microsoft, it's similar to Google's [LitElement](https://lit-element.polymer-project.org/guide) in that it provides a very lightweight wrapper around native web component API's. Overall the experience has been interesting but I'm not sure I'm willing to give up on Vue just yet.

# Non-Web Components

When writing a non-web component called `custom-component` using a framework like Vue, React or Angular, you quite often end up with HTML and CSS that looks like this:

```html
<div class="custom-component">
    <h1>Hello</h1>
    <p>World</p>
</div>
```

```css
.custom-component {
    // ...
}
```

The rendered HTML from these frameworks looks exactly the same as above. However, when writing web components, you have an addition custom HTML element rendered into the DOM with the contents of the element being rendered into the shadow DOM which can introduce bugs for the unwary developer.

```html
<custom-component>
    <!-- Shadow DOM -->
    <div class="custom-component">
        <h1>Hello</h1>
        <p>World</p>
    </div>
</custom-component>
```

# The Wrapper div

The first gotcha we encounter is that we now have an extra HTML element that we don't actually need. The fix for this is simple, we can simply remove the wrapper `div` inside our component, so our code now becomes:

```html
<h1>Hello</h1>
<p>World</p>
```

```css
:host {
    // ...
}
```

We can use the `:host` pseudo-selector to style the `custom-component` HTML element and now when our component is rendered we get the following:

```html
<custom-component>
    <!-- Shadow DOM -->
    <h1>Hello</h1>
    <p>World</p>
</custom-component>
```

# Semantic HTML

Removing the wrapper `div` is all well and good but what if it's not a `div` but a semantic HTML element like `section` or `article`? Both of these tags have a specific meanings for screen readers and search engines and we must use these tags to support them. Well, in this case we have to bring back our wrapper element like so and encounter our second gotcha:

```html
<section class="custom-component">
    <h1>Hello</h1>
    <p>World</p>
</section>
```

Our HTML will now be rendered as:

```html
<custom-component>
    <section class="custom-component">
        <h1>Hello</h1>
        <p>World</p>
    </section>
</custom-component>
```

Now if we want to style the component we have to target the `.custom-element` class where we can place most of our styles but we also need to target the `:host` to change some defaults.

The default value for `display` in a custom HTML element like `<custom-element>` is actually `inline` which is usually not what you will want (`margin`, `padding`, `border` will not work as you expect), so you'll need to explicitly set your own default. This is our third gotcha! I think it makes sense to be explicit and do this for every web component.

In addition, if the content of your web component does not extend beyond the boundary of the component itself, it's a good idea to add `contain: paint` for a small performance boost (The Mozilla Docs have more on [contain](https://developer.mozilla.org/en-US/docs/Web/CSS/contain)).

```css
:host {
    display: block;

    contain: paint;
}

.custom-component {
    // ...
}
```

# Final Thoughts

The promise of web components are that they are lightweight and fast to run. The downside seems to be that there is more to think about when building a web component, as opposed to a standard framework based component using Vue, React or Angular.
