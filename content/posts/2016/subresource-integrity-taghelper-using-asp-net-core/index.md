---
title: "Subresource Integrity TagHelper Using ASP.NET Core - Part 1"
description: "Use an ASP.NET Core TagHelper to implement Subresource Integrity (SRI) to ensure that external resources have not been tampered with."
author: "Muhammad Rehan Saeed"
permalink: "/subresource-integrity-taghelper-using-asp-net-core/"
cover_image: "./images/hero/Make-Security-Easy-1366x768.png"
date: "2016-03-06"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET Core"
  - "ASP.NET MVC"
  - ".NET Boxed"
  - "C#"
  - "Content Delivery Network (CDN)"
  - "Cryptography"
  - "NWebSec"
  - "Security"
  - "Subresource Integrity (SRI)"
---

- [Subresource Integrity TagHelper Using ASP.NET Core - Part 1](/subresource-integrity-taghelper-using-asp-net-core/)
- [Subresource Integrity TagHelper Using ASP.NET Core - Part 2](/subresource-integrity-taghelper-using-asp-net-core-part-2/)

# What is Subresource Integrity (SRI)

Can you trust your CDN provider? What if they get hacked and the copy of jQuery you are using hosted by them has some malicious script added to it? You would have no idea this was happening! This is where Subresource Integrity (SRI) comes in.

It works by taking a cryptographic hash of the file hosted on the CDN and adding that to your script or link tags. So in our case if we are using jQuery, we would add an integrity and `crossorigin` attribute to our script tag like so:

```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js" 
        integrity="sha256-ivk71nXhz9nsyFDoYoGf2sbjrR9ddh+XDkCcfZxjvcM=" 
        crossorigin="anonymous"></script>
```

The cryptographic hashing algorithm used can be SHA256, SHA384 or SHA512 at the time of writing. In fact, you can use more than one at a time and browsers will pick the most secure one to check the file against.

The current official standard [document](http://www.w3.org/TR/SRI/) states that currently only script or link tags are supported for your JavaScript or CSS. However, it also states that this is likely to be expanded to pretty much any tag with a `src` or `href` attribute such as images, objects etc.

Scott Helme has a great [post](https://scotthelme.co.uk/subresource-integrity/) on the subject which I highly recommend you read (It's where I learned about it).

# The ASP.NET Core Tag Helper

I implemented a tag helper for ASP.NET Core which is as simple to use as this:

```html
<script asp-subresource-integrity
        src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
```

Don't you love it when security is so easy! I'm a big believer in making security as easy as having a big red button that says 'on' and turning it on by default so people don't have to. It's the only way these things will get used! What is it doing behind the scenes?

1. Downloads the file from the CDN.
2. Calculates a SHA512 hash for the file.
3. Adds the `integrity` and `crossorigin` attributes to the script tag.
4. Adds the SHA512 hash value to the distributed cache (IDistributedCache) built in to ASP.NET Core with no expiry date. If you are using a distributed cache like [Redis](http://redis.io/) (Which you should for the pure speed of it) then the hash will be remembered.
5. The next time the page loads, the hash is retrieved from the cache, so there is very little performance impact of this tag helper.

There are actually two tag helpers, one supports any tag with a `src` attribute and another supports any tag with a `href` element. This is in preparation for when subresource integrity is opened up to tags other than script and link.

# Gotchas

In the past, I have often omitted the scheme from the CDN URL like so:

```html
<script src="//ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js"></script>
```

However, I have noticed that Firefox, does not like it when you use SRI and omit the scheme. It stops the file from loading completely. When you think about it, this makes sense. We are trying to confirm that the resource has not been changed, one of the ways to do this is to use HTTPS. It does not make sense to use SRI over HTTP.

The other gotcha I found is that the resource must have the `Access-Control-Allow-Origin` HTTP header. It can be set to `*` or your individual domain name. Now, I have been using CDN resources provided by [Google](http://ajax.googleapis.com) (for jQuery), [Microsoft](http://www.asp.net/ajax/cdn) (for Bootstrap, jQuery Validation etc.) and [MaxCDN](https://www.maxcdn.com/) (for Font Awesome) because they are free, most browsers have probably already got a copy of the files from there and because they have very fast global exit nodes.

However, I have discovered that all provide the `Access-Control-Allow-Origin` HTTP header except Microsoft on some of their resources. Strangely, they return the header for Bootstrap but not for the jQuery Validation scripts. I have reached out to them through my capacity as an MVP and hope to get the issue solved. In the mean time, if you are using Microsoft's CDN you can switch to another CDN or wait for them to fix the issue.

# Where Can I Get It?

This tag helper is available in a few ways:

1. The [.NET Boxed Boxed.AspNetCore.TagHelpers](https://www.nuget.org/packages/Boxed.AspNetCore.TagHelpers/) NuGet package.
2. Check out source code in the [.NET Boxed Framework](https://github.com/Dotnet-Boxed/Framework) GitHub repository.
