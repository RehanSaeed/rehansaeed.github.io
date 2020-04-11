---
title: "Cheat Sheet"
description: "Shows how to use markdown"
author: "Muhammad Rehan Saeed"
permalink: "/cheat-sheet/"
cover_image: "/images/hero/NET-1366x768.png"
date: "2020-03-04T11:22:33Z"
published: false
categories:
  - "Foo"
tags:
  - "Foo"
---

# Table of Contents

# Formatting

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent condimentum dolor in tellus dictum, vel pharetra lacus ultricies. Phasellus porttitor scelerisque elit et ultrices. Donec auctor sapien finibus metus commodo, nec tempus tortor interdum. Vestibulum porttitor venenatis eros quis lacinia.

Duis aliquet ex eu scelerisque ultricies. Nam ac sagittis ligula. Vestibulum velit erat, tristique nec elit nec, venenatis ullamcorper mi. Aliquam sollicitudin finibus enim in volutpat. Duis cursus hendrerit turpis, vitae porta mi euismod rutrum. Suspendisse blandit aliquet rutrum. Nunc nec pharetra magna. Maecenas posuere in leo vitae tempus. Suspendisse potenti. Duis sed faucibus massa.

**Bold** *Italic* [Link](https://example.com)

> Quote

# Lists

- One
- two
- Three

1. One
2. Two
3. Three

- One
  - One One
  - One Two
  - One Three
- Two
  1. Two One
  2. Two Two
  3. Two Three

# Tables

| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

# Custom Containers

::: tip Title
This is a tip
:::

::: warning Title
This is a warning
:::

::: danger Title
This is a dangerous warning
:::

::: details Title
Some Code
:::

# Syntax Highlighting

```js{codeTitle: "Code Title Code Title"}
// Code Title
```

```js{numberLines: true}
// Line Numbers
```

```js{2,4-5}
export default {
  data () {
    return {
      msg: 'Line Highlight'
    }
  }
}
```

```js{codeTitle: "Code Title Code Title"}{numberLines: true}{2,4-5}
export default {
  data () {
    return {
      msg: 'All'
    }
  }
}
```

# Embed Code Snippets

`embed:foo.cs`

# Embed Youtube

https://www.youtube.com/watch?v=PGM_uBy99GA

# Embed Twitter

https://twitter.com/RehanSaeedUK/status/1224729077296267264

# Embed CodePen

https://codepen.io/dyarfi/pen/VwLEjBd
