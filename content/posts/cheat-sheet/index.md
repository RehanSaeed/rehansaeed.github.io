---
title: "Cheat Sheet"
description: "Shows how to use markdown"
author: "Muhammad Rehan Saeed"
permalink: "/cheat-sheet/"
cover_image: "./images/NET.png"
date: "2020-03-04"
published: true
categories:
  - "Foo"
tags:
  - "Foo"
---

# Table of Contents

# Formatting

**Bold** *Italic* [Link](https://example.com)

> Quote

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

 # Import Code Snippets

 <<< @/source/_posts/cheat-sheet/foo.cs

 <<< @/source/_posts/cheat-sheet/foo.cs{2}
