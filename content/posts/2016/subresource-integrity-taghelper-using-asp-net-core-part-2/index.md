---
title: "Subresource Integrity TagHelper Using ASP.NET Core - Part 2"
description: "Use an ASP.NET Core TagHelper to implement Subresource Integrity (SRI) to ensure that external resources have not been tampered with. With is part 2."
author: "Muhammad Rehan Saeed"
permalink: "/subresource-integrity-taghelper-using-asp-net-core-part-2/"
cover_image: "/images/hero/Make-Security-Easy-1366x768.png"
date: "2016-03-12"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET Community Standup"
  - "ASP.NET Core"
  - "ASP.NET MVC"
  - ".NET Boxed"
  - "C#"
  - "Content Delivery Network (CDN)"
  - "Cryptography"
  - "Damian Edwards"
  - "Jon Galloway"
---

- [Subresource Integrity TagHelper Using ASP.NET Core - Part 1](/subresource-integrity-taghelper-using-asp-net-core/)
- [Subresource Integrity TagHelper Using ASP.NET Core - Part 2](/subresource-integrity-taghelper-using-asp-net-core-part-2/)

Last week I wrote part one of a blog post discussing a Subresource Integrity (SRI) tag helper I wrote for ASP.NET Core. It turns out the post was featured on the ASP.NET Community Standup and discussed at length by [Scott Hanselman](http://twitter.com/shanselman), [Damian Edwards](http://twitter.com/damianedwards) and [Jon Galloway](http://twitter.com/jongalloway). Here is the discussion:

https://www.youtube.com/watch?v=Mu2jol8EmVo

The overall impression from the standup was that the SRI tag helper I wrote was a good first step but there was more work to be done. It was however, still more secure than "the rest of the internet" according to Jon Galloway. The main issue raised during the standup was that the first call made to get the resource could retrieve a version of it that was compromised.

My initial thinking was that you could check the files at deployment time when the tag helper first runs. Then the tag helper would have calculated the hash and cached it without any expiration time, so you are good from then on. In hindsight checking the files on every deployment is not great for the developer.

# The 2nd Iteration

So for the next iteration I have added a new alternative source attribute, basically a local file from which the SRI is calculated. Now the tag helper looks like this when in use:

```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js" 
        asp-subresource-integrity-src="~/js/jquery.min.js"></script>
```

You can also customize the hashing algorithm used in your SRI. You can choose between SHA256, SHA384 and SHA512, by default the tag helper uses the most secure option SHA512 which seems to be supported by all browsers. Should you choose to use a different hashing algorithm or even use more than one algorithm, you can set the `asp-subresource-integrity-hash-algorithms` attribute which is just a flagged enumeration (Note that I am using ASP.NET Core RC2 syntax, where the name of the enumeration can be omitted):

```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js" 
        asp-subresource-integrity-src="~/js/jquery.min.js"
        asp-subresource-integrity-hash-algorithms="SHA256 | SHA384 | SHA512"></script>
```

What is it doing behind the scenes?

1. Reads the local file specified using the asp-subresource-integrity-src  attribute.
2. Calculates a SHA512 hash (or your custom selection) for the file.
3. Adds the `integrity` and `crossorigin` attributes to the script tag.
4. Adds the hash value to the distributed cache (`IDistributedCache`) built in to ASP.NET Core with no expiry date. If you are using a distributed cache like [Redis](http://redis.io/) (Which you should for the pure speed of it) then the hash will be remembered.
5. The next time the page loads, the hash is retrieved from the cache, so there is very little performance impact of this tag helper.

# Microsoft CDN Still Broken for SRI

In my last post I noted that SRI requires that the resource has a valid `Access-Control-Allow-Origin` HTTP header (usually with a `*` value). Microsoft's CDN does not supply this header for all it's resources. I did reach out to Microsoft to see if this could be fixed. I've not heard back yet. I would imagine that with a CDN of that size, fixing this issue is a non-trivial thing so it might take time but I'll do some more chasing.

# Browser Extensions and SRI

Last week, I noted that leaving out the scheme in the URL for your CDN resource e.g. `//example.com/jquery.js` caused Firefox to error and fail to load the resource completely and I recommended that you always include the `https://` scheme. It turns out that this was not Firefox causing the issue at all but a Firefox browser extension. I've yet to figure out which one yet as I have quite a few installed (most of them security related because I'm paranoid) but it's probably an extension called HTTPS Everywhere which attempts to use HTTPS if it is available. To be on the safe side and avoid this problem, always specify the `https://` scheme.

# CDN Fallbacks

So what happens when a CDN script is maliciously edited or (much more likely) you messed up and your local copy of the CDN script is different from the one in the CDN? Well, this is where CDN script fallbacks come in. There is already a tag helper provided by ASP.NET Core that does this:

```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js"
        asp-subresource-integrity-src="~/js/jquery.min.js"
        asp-fallback-src="~/js/jquery.min.js"
        asp-fallback-test="window.jQuery">
</script>
```

I should also mention that although the fallback tag helper is cool and very simple to use, it adds inline script which is not compatible with the [Content Security Policy (CSP)](/content-security-policy-for-asp-net-mvc/) HTTP header. If you care about security and you probably do if you are reading this, that means using the fallback tag helper is not possible. I myself prefer to move all my fallback checks to a separate JavaScript file.

# sritest.io

A big shout out to [Gabor Szathmari](https://blog.gaborszathmari.me) and his website [sritest.io](https://sritest.io/). It is able to scan your page and check that all your external resources have SRI enabled and most importantly that it has been setup correctly. You could use the console window from a browser like Chrome or Firefox but this website will also tell you if you've forgotten to add SRI to any external resources and also highlight edge cases such as the ones I highlighted in these two blog posts.

![sritest.io Screenshot](./images/SRI-Test.png)

# Where Can I Get It?

This tag helper is available in a few ways:

1. The [.NET Boxed Boxed.AspNetCore.TagHelpers](https://www.nuget.org/packages/Boxed.AspNetCore.TagHelpers/) NuGet package.
2. Check out source code in the [.NET Boxed Framework](https://github.com/Dotnet-Boxed/Framework) GitHub repository.
