---
title: "Cheat Sheet"
description: "Shows how to use markdown"
author: "Muhammad Rehan Saeed"
permalink: "/cheat-sheet/"
cover_image: "./images/NET.png"
date: "2020-03-04"
published: false
categories:
  - ""
tags:
  - ""
---

# Table of Contents
[[toc]]

# Tables

| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

# Emoji

:tada: :100:

# Custom Containers

::: tip
This is a tip
:::

::: warning
This is a warning
:::

::: danger
This is a dangerous warning
:::

::: details
This is a details block, which does not work in IE / Edge
:::

::: danger STOP
Danger zone, do not proceed
:::

::: details Click me to view the code
```js
console.log('Hello, VuePress!')
```
:::

# Syntax Highlighting

```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```

 # Import Code Snippets

 <<< @/source/_posts/cheat-sheet/foo.cs

 <<< @/source/_posts/cheat-sheet/foo.cs{2}
