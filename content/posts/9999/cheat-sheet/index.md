---
title: "Cheat Sheet"
description: "Shows how to use markdown"
author: "Muhammad Rehan Saeed"
permalink: "/cheat-sheet/"
heroImage: "/images/hero/Microsoft-.NET-1366x768.png"
date: "2020-03-04T11:22:33Z"
dateModified: "2020-04-22T11:22:33Z"
published: false
categories:
  - "Foo"
tags:
  - "Foo"
---

# Table of Contents

# Heading 1 Heading 1 Heading 1 Heading 1

## Heading 2 Heading 2 Heading 2 Heading 2

### Heading 3 Heading 3 Heading 3 Heading 3

#### Heading 4 Heading 4 Heading 4 Heading 4

##### Heading 5 Heading 5 Heading 5 Heading 5

# Paragraphs

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent condimentum dolor in tellus dictum, vel pharetra lacus ultricies. Phasellus porttitor scelerisque elit et ultrices. Donec auctor sapien finibus metus commodo, nec tempus tortor interdum. Vestibulum porttitor venenatis eros quis lacinia.

Duis aliquet ex eu scelerisque ultricies. Nam ac sagittis ligula. Vestibulum velit erat, tristique nec elit nec, venenatis ullamcorper mi. Aliquam sollicitudin finibus enim in volutpat. Duis cursus hendrerit turpis, vitae porta mi euismod rutrum. Suspendisse blandit aliquet rutrum. Nunc nec pharetra magna. Maecenas posuere in leo vitae tempus. Suspendisse potenti. Duis sed faucibus massa.

# Formatting

**Bold**, _Italic_, ~~Strikethrough~~,

# Links

[Link](https://example.com)
[Empty Link]()

# Horizontal Rule

---

# Lists

- Lorem ipsum dolor sit amet, consectetur adipiscing elit.
- Lorem ipsum dolor sit amet, consectetur adipiscing elit.
- Lorem ipsum dolor sit amet, consectetur adipiscing elit.

1. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
2. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
3. Lorem ipsum dolor sit amet, consectetur adipiscing elit.

- Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
- Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  1. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  2. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  3. Lorem ipsum dolor sit amet, consectetur adipiscing elit.

# Blockquotes

> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent condimentum dolor in tellus dictum, vel pharetra lacus ultricies.

With line break:

> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent condimentum dolor in tellus dictum, vel pharetra lacus ultricies.
>
> Phasellus porttitor scelerisque elit et ultrices. Donec auctor sapien finibus metus commodo, nec tempus tortor interdum. Vestibulum porttitor venenatis eros quis lacinia.

With `<cite>`:

> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent condimentum dolor in tellus dictum, vel pharetra lacus ultricies.
>
> Phasellus porttitor scelerisque elit et ultrices. Donec auctor sapien finibus metus commodo, nec tempus tortor interdum. Vestibulum porttitor venenatis eros quis lacinia.
>
> <footer><cite>Muhammad Rehan Saeed</cite></footer>

# Tables

| Tables        |      Are      |  Cool |
| ------------- | :-----------: | ----: |
| col 3 is      | right-aligned | $1600 |
| col 2 is      |   centered    |   $12 |
| zebra stripes |   are neat    |    $1 |
| zebra stripes |   are neat    |    $1 |
| zebra stripes |   are neat    |    $1 |
| zebra stripes |   are neat    |    $1 |
| zebra stripes |   are neat    |    $1 |
| zebra stripes |   are neat    |    $1 |

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

# Keyboard

This uses `<kbd>` and looks like this ||CTRL+C||. Cool!

# Syntax Highlighting

This is `inline` code.

```
// No Language
```

```js{codeTitle: "Code Title Code Title"}
// Code Title
```

```js{numberLines: true}
// Line Numbers
// Line Numbers
// Line Numbers
// Line Numbers
// Line Numbers
// Line Numbers
// Line Numbers
// Line Numbers
// Line Numbers
// Line Numbers
// Line Numbers
// Line Numbers
// Line Numbers
// Line Numbers
// Line Numbers
```

```js
// Line Highlight
export default {
  data() {
    return {
      msg: "Line Highlight",
    };
  },
};
```

```js{2,4-5}
// Line Highlight
export default {
  data () {
    return {
      msg: 'Line Highlight'
    }
  }
}
```

```powershell
docker image build --tag foo:1.0.0 --label "build"="123" --label "changeset"="0d9c7d3b77817caab3977b16d1d76bb3eb024837" .
```

```js{codeTitle: "Code Title Code Title Code Title Code Title Code Title Code Title Code Title Code Title Code Title Code Title Code Title Code Title Code Title Code Title"}{numberLines: true}{2,4-5,9-10}
// Code Title, Line Numbers, Line Highlight ----------------------------------------------
// Code Title, Line Numbers, Line Highlight
// Code Title, Line Numbers, Line Highlight
// Code Title, Line Numbers, Line Highlight
// Code Title, Line Numbers, Line Highlight
// Code Title, Line Numbers, Line Highlight
// Code Title, Line Numbers, Line Highlight
// Code Title, Line Numbers, Line Highlight
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

# Embed Images

![Code](./images/Code-1600x900.jpg)

# Embed Youtube Video

https://www.youtube.com/watch?v=PGM_uBy99GA

# Embed Youtube Playlist

https://www.youtube.com/playlist?list=PLUAZAVKVXTmQEF67lddyErymHlBDaPpjU
