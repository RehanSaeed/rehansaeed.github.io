---
title: "Choosing a Static Site Generator"
description: ""
author: "Muhammad Rehan Saeed"
permalink: "/choosing-a-static-site-generator/"
heroImage: "/images/hero/Static-Site-Generators-1600x900.png"
date: "2020-06-09T19:19:49Z"
dateModified: null
published: false
categories:
  - "Web"
tags:
  - "Static Site Generator"
  - "WordPress"
  - "Jekyll"
  - "Gatsby"
  - "Statiq"
  - "GraphQL"
  - "Hugo"
  - "VuePress"
  - "Next.js"
  - "Nuxt.js"
  - "Gridsome"
---

I recently rebuilt this blog using a static site generator called [Gridsome](https://gridsome.org/) which is based on [Vue.js](https://vuejs.org/) and [GraphQL](https://graphql.org/). This is the story of all the static site generators I tried, how I moved from WordPress to Gridsome and what I discovered along the way.

I want blogging to be as low friction as possible. Quite frankly if there is even a little friction, I'll stop writing posts which is what has kind of happened over the last couple of years where my output has definitely dropped.

# WordPress was Giving Me a Bad Time

I was using WordPress in the past which was achingly slow and a major barrier to writing posts. Thinking of writing a post in WordPress just put me off it altogether.

WordPress stores its posts in HTML. You can use markdown using the new Gutenberg plugin but if you want to edit the post after the fact, you're back to HTML.

The other issue is that WordPress gets hacked all the time because people don't keep it and any installed plugins up to date. However, I found over the years that when I upgraded a plugin, there was a 50% chance that something was going to break and another 20% chance that I wouldn't find out about it until a week later.

Plugins were the bane of my life. My code formatting plugin became unsupported without an easy alternative that I could migrate to. This meant I had to stick to an older version of PHP and wait for another plugin to add a migration path.

Finally, I was paying for hosting on Azure Web apps which isn't the simplest or cheapest option I could have gone with. It was time to move...

# Static vs Dynamic Sites

So why switch from a dynamic site like WordPress, to a statically generated site? I found so many reasons, some of which I hadn't thought of before I made the switch.

The obvious ones are that a static site is going to be faster and cheaper to run. A nice side effect of being faster is that search engines will also give you a little more link juice and rank you higher.

The biggest win for me was that I can now finally own my own content. It's strange to say that hosting my own WordPress site was not owning my own content but the fact is, I was not fully in control of the content that WordPress was generating. I became painfully aware of this after I had exported my posts from WordPress to markdown.

I had used certain plugins that formatted content strangely or I was using short codes which don't translate well. There were a myriad of issues. The amazing thing was that I could use VS Code to easily find and replace broken formatting with the help of some regular expression magic (I know enough to be dangerous!). The downside was that I had to manually go back, fix and check every blog post I'd ever written.

At the end of the day, my content is now simple markdown files formatted to my liking. There is nothing simpler than a text file and I am finally in control. If I ever need to pick up and switch to a different static file generator, I can pick-up my content which is in an open, easy to move format and move it easily. I'm never going back.

The other thing that I really loved was building the site itself. I have a folder of bookmarks containing cool little things you can do on the web that I have collected over the years. I put nearly all of it into practice, which was a lot of fun but did take me a couple of months to finish. It turns out, I love HTML, CSS and JavaScript but particularly CSS where visual feedback is instant and very satisfying.

# Picking a Static Site Generator

Surveying the static site generator landscape was a dizzying experience. There didn't seem to be a clear winner at first, so this is what I found:

::: warning
I certainly didn't do an in-depth review of each static site generator. These are my personal views based on the limited knowledge, limited time looking at each project and in-built human biases I have.
:::

## Jekyll

The one that started it all, [Jekyll](https://jekyllrb.com/) is backed by GitHub and has been going for a long time, which means it has a large community and lots of plugins. Hosting with GitHub pages was easy, since there were some nice integrations.

My only problem with it was that it was built on Ruby which in my experience a year ago, does not play well on Windows. I hope that has changed but I suppose you could use the Windows Subsystem for Linux (WSL) to run Ruby instead.

[Khalid Abuhakmeh](https://khalidabuhakmeh.com/) uses Jekyll and his blog looks pretty amazing, so well worth a look.

## Gatsby

[Gatsby](https://www.gatsbyjs.org/) is built with [React](https://reactjs.org/) and [GraphQL](https://graphql.org/). Plugins can be used used to hook up various data sources like markdown files and GraphQL makes querying extremely simple.

I'm not much of a React fan personally but if you are, it has a huge following, so community support and plugins are easy to find. Plus I cannot understate how much simpler the GraphQL plugins make it, to consume arbitrary content. Knowing GraphQL is important but it's not too difficult to learn.

## Statiq

[Statiq](https://statiq.dev/framework/) is built on ASP.NET Core and uses Razor to write views. It's a very new static site generator and I believe is an evolution of another project called [Wyam](https://wyam.io/). If you're not too knowledgeable in web technologies and live in the C# and .NET space, this may be a really good choice for you.

## Hugo

I've heard a lot of good things about [Hugo](https://gohugo.io). It's built on Go. The community is pretty large and the project is pretty popular. If I hadn't gone with Gridsome, I would have liked to spend some more time with Hugo.

My only issue with Hugo having used Kubernetes Helm templates, was that I found the Go templating quite difficult to read due to the liberal use of brackets everywhere. However, the system is fairly intuitive to use.

```html
{{ define "main" }}
    <main aria-role="main">
      <header class="homepage-header">
        <h1>{{.Title}}</h1>
        {{ with .Params.subtitle }}
        <span class="subtitle">{{.}}</span>
        {{ end }}
      </header>
      <div class="homepage-content"></div>
      <div>
        {{ range first 10 .Site.RegularPages }}
            {{ .Render "summary"}}
        {{ end }}
      </div>
    </main>
{{ end }}
```

## VuePress

I took a pretty deep dive into [Vuepress](https://vuepress.vuejs.org/) which is built on [Vue.js](https://vuejs.org/). I'm a huge fan of Vue.js due to its single file components which allow you to write HTML, JavaScript **and** CSS in a single file. React has a lot to say about the first two but leaves CSS up to you, which has led to the whole CSS-in-JS movement. Personally, I think writing simple CSS or SCSS is where it's at.

In the end though, I found that VuePress is not really geared towards building blogs, it's more geared towards documentation sites for open source projects. It does a really good job in that space.

## Nuxt.js/Next.js

[Nuxt.js](https://nuxtjs.org/) is a well known framework which uses [Vue.js](https://vuejs.org/) in combination with server side rendering. [Next.js](https://nextjs.org/) is a similar project for React. What some don't know is that you can also create static sites using these tools.

Nuxt.js recently released [Nuxt Content](https://content.nuxtjs.org/) which allows you to drive content from Markdown files. This came too late for me to try but I'd certainly take a deeper look the next time.

## Gridsome

[Gridsome](https://gridsome.org/) is the [Vue.js](https://vuejs.org/) equivalent of Gatsby, in that it also uses the power of [GraphQL](https://graphql.org/).

There are a lot of plugins that can connect your static site to various sources of data using GraphQL. Want a data driven site? Want to consume some markdown, JSON, random images, content from WordPress or Ghost? Just install a plugin and write a simple GraphQL query.

In the end, I chose Gridsome for its simplicity. Its just HTML, SCSS and JavaScript at the end of the day (albeit in a single file component). It's the closest solution to the web and also why I really enjoy Vue.js.

# Hosting Your Static Site

## Netlify

I realized that a **lot** of people are using Netlify in my reading. It has a lot of nice little extra features but I personally didn't need any of them but they're worth a look. Netlify has a free tier but does ramp up to being quite costly after that, so beware and make sure your site doesn't use a lot of bandwidth.

## GitHub Pages

I chose to host my site on GitHub pages. It's free until GitHub thinks you're abusing it and asks you to move. It doesn't have any bells or whistles but it works. There are two issues I wish they would fix:

1. Your GitHub project has to end with `.github.io`.
2. The branch containing the actual static files to be served has to be called `master`.

With all that said, it's simple and there was one less thing I had to worry about, since my content was already on GitHub.

# Conclusions

I picked Gridsome and am pretty happy but you may have a different knowledge set and something else might suit you. Whatever makes you happy! The key is that writing blog posts needs to be low friction, so that you actually end up doing it.

In my next post, I'll talk about certain cool features that I added to my blog and what features I think are essential.
