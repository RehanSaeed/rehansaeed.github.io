---
title: "Social TagHelpers for ASP.NET Core"
description: "Enhance the experience of sharing a page from your site through the use of social media meta tags implemented with ASP.NET Core TagHelpers."
author: "Muhammad Rehan Saeed"
permalink: "/social-taghelpers-for-asp-net-core/"
cover_image: "/images/hero/Social-Media-1366x768.png"
date: "2016-03-19"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET Core"
  - "ASP.NET MVC"
  - "ASP.NET MVC 5"
  - ".NET Boxed"
  - "GitHub"
  - "HTML Helper"
  - "TagHelper"
---

Social media websites like Facebook, Twitter, Google+, Pintrest etc. provide ways to enhance the experience of sharing a page from your site through the use of meta tags. These provide metadata about what is on your page in a standardized format that these sites can use to better display your content. Here are two quick examples of the enhanced content that Twitter and Facebook display when you add these meta tags to your page:

![Facebook Open Graph Share](./images/Facebook-Open-Graph-Share.png)

![Twitter Player Card](./images/Twitter-Player-Card.png)

It turns out that most of the social media sites use only two standard sets of meta tags, namely Open Graph (Facebook) and Twitter Cards. I have built ASP.NET Core TagHelpers and ASP.NET 4.6 HTML Helpers which make it easy to add these meta tags to your site.

# Author Meta Tag

This is nothing to do with social media meta tags but worth mentioning. The author meta tag has been around for many years and is a standard but very basic way of telling search engines and others, who authored your page. It's unclear where if anywhere this tag is used but as it's a standard I like to put it in anyway as it doesn't hurt to do so.

```html
<meta name="author" content="Muhammad Rehan Saeed">
```

# Open Graph (Facebook)

[Open Graph](http://ogp.me/) is an open standard (it's set by Facebook and doesn't seem so open to me as I'll explain),  containing several sets of meta tags which represent various things, such as:

- Website
- Music Album
- Music Song
- Music Playlist

- Video Movie
- Video Episode
- Video TV Show
- Video Other

- Article
- Book
- Profile

Here is an example of what the meta tags for a page looks like for the `Website` set. Note the `type` tag which determines the name of the set used:

```html
<meta property="og:type" content="website">
<meta property="og:title" content=".NET Boxed">
<meta property="og:url" content="http://example.com/">
<meta property="og:image" content="http://example.com/1200x630.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content=".NET Boxed">
```

What I find perplexing is that Facebook also have their [own](https://developers.facebook.com/docs/reference/opengraph) custom sets of meta tags over and above the ones in Open Graph. These are:

- Article
- Books Author
- Books Book
- Books Genre
- Business
- Fitness Course
- Game Achievement
- Music Album

- Music Playlist
- Music Radio Station
- Music Song
- Place
- Product
- Product Group
- Product Item
- Profile

- Restaurant Menu
- Restaurant Menu Item
- Restaurant Menu Section
- Restaurant
- Video Episode
- Video Movie
- Video Other
- Video TV Show

As you can see there is a lot more choice and detail here. What's confusing is that there is overlap between the Open Graph and Facebook meta tags. Both have sets covering music, video and books, with the Facebook sets requiring you to add far more detailed metadata. The Open Graph tags may play nicer with other social media sites that use these tags while the Facebook ones will obviously give the best experience for the user on Facebook. The above meta tags can be set using my tag helpers or HTML helpers depending on the version of ASP.NET you are using like so:

```html
<open-graph-website site-name="My Website"
                    title="Page Title"
                    main-image="@(new OpenGraphImage(
                        Url.AbsoluteContent("~/img/1200x630.png"),
                        ContentType.Png,
                        1200,
                        630))"
                    determiner="OpenGraphDeterminer.Blank">
```

```cs
@Html.OpenGraph(new OpenGraphWebsite(
    "Page Title",
    new OpenGraphImage(
        Url.AbsoluteContent("~/1200x630.png"))
        {
            Height = 630, 
            Type = ContentType.Png, 
            Width = 1200 
        })
    {
        Determiner = OpenGraphDeterminer.Blank,
        SiteName = "My Site"
    });
```

Of course there are tag helpers and HTML helpers for all of the above meta tag sets.

# Twitter Cards

[Twitter cards](https://dev.twitter.com/cards/getting-started) require meta tags representing one of several 'cards' which can represent different things:

- App - A phone app.
- Gallery - A photo gallery.
- Photo - A single photo.
- Player - A video.
- Product - A product you want to sell.
- Summary - A summary of the current page. This is usually the default choice for any page.
- Summary Large Image - The same as summary but with a large image.

If you have already added Open Graph meta tags, then Twitter can make use of them and you can omit some of the meta tags that Twitter requires. This makes adding a Twitter Card very easy and in fact, most of the time all you need to do is include a Twitter username and the card type. Here is an example of what Twitter card meta tags look like given that you already have Open Graph meta tags:

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@RehanSaeedUK">
```

Below, is an example of how to generate the above code using my tag helpers or HTML helpers. I have used the `Summary Large Image` card (Notice the double `@` sign in the tag helper, this is because `@` is a special character in Razor and a double `@@` escapes the character):

```html
<twitter-card-summary-large-image username="@@RehanSaeedUK">
```

```cs
@Html.TwitterCard(new SummaryLargeImageTwitterCard("@RehanSaeedUK"));
```

There are also tag helpers and HTML helpers for all of the above Twitter cards. The other cards are a little more complicated than the summary card I have shown in my example above.

# Google+, Pintrest & Others

Due to the proliferation of Facebook's Open Graph and Twitters card meta tags, other social media sites, search engines and other sites also use them. By implementing the above meta tags, you can cover most of the ground with very little effort.

# Validating Meta Tags

Due to the difficulty of getting these meta tags correct, there are several validator tools that the various social media companies provide which let you confirm that you have not made any mistakes. Now, if you've used my tag helpers or HTML helpers you should be ahead of the game and things should just work but it's worth checking out:

- [Facebook Debugger](https://developers.facebook.com/tools/debug)
- [Twitter Validation Tool](https://dev.twitter.com/docs/cards/validation/validator)
- [Google Structured Data Testing Tool](http://www.google.com/webmasters/tools/richsnippets)
- [Pinterest Rich Pins Validator](http://developers.pinterest.com/rich_pins/validator)

# Performance

When I was looking into implementing these tag helpers and HTML helpers, I looked at a few other efforts on GitHub. However, for some strange reason all of them used reflection behind the scenes. At this point I'd like to go on a short rant against using reflection. I've seen a lot of 'clever' code use reflection over the years and I've seen a far too many developers hammer far too many nails using it. It's a very powerful tool but gets abused far too often. Now, back to resuming normal service. This made these libraries pretty slow for generating a few meta tags, not to mention that they don't support ASP.NET Core. My implementation uses a single `StringBuilder` and should be fairly fast. At some point I will even use [object pooling](https://stackoverflow.com/questions/2510975/c-sharp-object-pooling-pattern-implementation) to reuse copies of `StringBuilder`.

# Where Can I Get It?

This tag or HTML helper is available in a few ways:

1. The [.NET Boxed Boxed.AspNetCore.TagHelpers](https://www.nuget.org/packages/Boxed.AspNetCore.TagHelpers/) NuGet package.
2. Check out source code in the [.NET Boxed Framework](https://github.com/Dotnet-Boxed/Framework) GitHub repository.
