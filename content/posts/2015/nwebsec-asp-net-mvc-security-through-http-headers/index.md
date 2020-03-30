---
title: "NWebSec ASP.NET MVC Security Through HTTP Headers"
description: "The NWebSec NuGet packages help secure your ASP.NET MVC site using HTTP headers. The ASP.NET Core Boilerplate project template configures them our of the box."
author: "Muhammad Rehan Saeed"
permalink: "/nwebsec-asp-net-mvc-security-through-http-headers/"
cover_image: "./images/hero/NWebSec-1366x768.png"
date: "2015-02-05"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET MVC"
  - "ASP.NET Core Boilerplate"
  - "C#"
  - "Cache-Control"
  - "Content Security Policy"
  - "CSP"
  - "GitHub"
  - "HTTP"
  - "HTTP Headers"
---

- [ASP.NET Core Boilerplate](/asp-net-mvc-boilerplate/)
- Security
    - [Securing the ASP.NET MVC Web.config (Updated)](/securing-the-aspnet-mvc-web-config/)
    - [NWebSec ASP.NET MVC Security Through HTTP Headers](/nwebsec-asp-net-mvc-security-through-http-headers/)
    - [Content Security Policy (CSP) for ASP.NET MVC](/content-security-policy-for-asp-net-mvc/)
- Search Engine Optimization (SEO)
    - [Canonical URL's for ASP.NET MVC](/canonical-urls-for-asp-net-mvc/)
    - [Dynamically Generating Robots.txt Using ASP.NET MVC](/dynamically-generating-robots-txt-using-asp-net-mvc)
- [Internet Favicon Madness (Updated)](/internet-favicon-madness/)
- [Building RSS/Atom Feeds for ASP.NET MVC](/building-rssatom-feeds-for-asp-net-mvc/)

This series of blog posts goes through the additions made to the default ASP.NET MVC project template to build the [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) project template. You can create a new project using this template by installing the [Visual Studio extension](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) or visit the [GitHub](https://github.com/Dotnet-Boxed/Templates) site to view the source code.

# Web Security is Hard

Security is hard at the best of times. Web security...well...it takes things to a whole new level of difficulty. It is ridiculously easy to slip up and leave holes in your sites defences.

This blog post as well as the [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) project are not a replacement for your own knowledge but it does help in setting up some defaults to be more secure and giving you a few more tools out of the box to help secure your site.

If you have some time and want to learn more about web security I highly recommend [Troy Hunt](http://www.troyhunt.com)'s Pluralsight course called [Hack yourself first](http://www.pluralsight.com/courses/hack-yourself-first). Note that Pluralsight requires a paid subscription (I'm quite against posting links to paid content but this course is pretty good. You can also get a trial subscription if you're interested). [Here](https://www.youtube.com/watch?v=rdHD6pVG66Q) is a free video by Troy which covers the same topic but in a little less depth.

I would also, highly recommend reading up on [Troy Hunt](http://www.troyhunt.com)'s blog which has extensive examples of real life websites in the wild, written by **major** companies getting web security **horribly** wrong.

# NWebSec

The [NWebSec](https://github.com/NWebsec/NWebsec) NuGet packages written by [André N. Klingsheim](http://www.dotnetnoob.com/) are a great way to add additional security to your ASP.NET MVC site. The [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) project template includes them by default.

Everything is preconfigured and commented as much as possible out of the box but remember this is a project template to get you started. You still need to put the effort in to customize the site security to your own requirements and put in some time learning about what each of the security features does and how best to use it.

# HTTP Headers

HTTP has been around for a very long time and so, a fairly large number of HTTP headers have been accumulated over time. Some are more useful than others but many of them are aimed at making the web more secure.

[André N. Klingsheim](http://www.dotnetnoob.com) has a brilliant blog post called [Security through HTTP response headers](http://www.dotnetnoob.com/2012/09/security-through-http-response-headers.html) which is a must read and fairly comprehensive. Go on, I'll wait for you to finish reading. NWebSec provides a host of [ActionFilterAttribute](http://www.asp.net/mvc/overview/older-versions-1/controllers-and-routing/understanding-action-filters-cs)'s (The rest of this post expects you to know what these are) which can be applied in three different ways:

1. Applied globally, so that they apply to all HTTP request/response messages.
2. Applied to individual controllers.
3. Applied to individual controller actions.

NWebSec's [ActionFilterAttribute](http://www.asp.net/mvc/overview/older-versions-1/controllers-and-routing/understanding-action-filters-cs)'s add and configure specific HTTP headers. Most of them are preconfigured in [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) for you to apply globally but some require you to take action.

## X-Frame-Options

The `X-Frame-Options` HTTP header stops click-jacking by stopping the page from opening in an iframe or only allowing it from the same origin (your domain). There are three options to choose from:

- **SameOrigin** - Specifies that the `X-Frame-Options` header should be set in the HTTP response, instructing the browser to display the page when it is loaded in an `iframe` - but only if the `iframe` is from the same origin as the page.
- **Deny** - Specifies that the `X-Frame-Options` header should be set in the HTTP response, instructing the browser to not display the page when it is loaded in an `iframe`.
- **Disabled** - Specifies that the `X-Frame-Options` header should not be set in the HTTP response.

We can use NWebSec to set it to block all `iframe`'s from loading the site which is the most secure option and the default option set in [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates).

```cs
// Filters is the GlobalFilterCollection from GlobalFilters.Filters
filters.Add(
    new XFrameOptionsAttribute()
    {
        Policy = XFrameOptionsPolicy.Deny
    });
```

You should note that for newer browsers, this HTTP header has become superseded by the `Content-Security-Policy` HTTP header which I will be covering in my next blog post. However, it should still be used for older browsers.

## Strict-Transport-Security

This HTTP header is only relevant if you are using [TLS](http://en.wikipedia.org/wiki/Transport_Layer_Security). It ensures that content is loaded over HTTPS and refuses to connect in case of certificate errors and warnings. You can read a complete guide to setting up your site to run with a **free** TLS certificate [here](http://www.troyhunt.com/2013/09/the-complete-guide-to-loading-free-ssl.html).

NWebSec currently does not support an MVC filter that can be applied globally. Instead we can use the Owin (Using the added `NWebSec.Owin` NuGet package) extension to apply it.

```cs
app.UseHsts(options => options.MaxAge(days:30).IncludeSubdomains());
```

As well as this header, MVC ships with the [RequireHttpsAttribute](https://msdn.microsoft.com/en-us/library/system.web.mvc.requirehttpsattribute%28v=vs.118%29.aspx). This forces an unsecured HTTP request to be re-sent over HTTPS. It does so without requiring any extra HTTP headers. Instead, this is a function of the MVC framework itself, which checks requests and simply redirects users if they send a normal HTTP request to a HTTPS URL. This attribute can be set globally (Using HTTPS throughout your site is a good idea these days) as shown below:

```cs
filters.Add(new RequireHttpsAttribute());
```

Both of these lines of code have an overlapping purpose but work in different ways. The `RequireHttpsAttribute` uses the MVC framework, while the NWebSec option relies on browsers responding to the Strict-Transport-Security HTTP header. Security should be applied in thick layers, so it's worth using both features. [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) assumes you are not using TLS by default but does include the above lines of code commented out with a liberal sprinkling of comments to make it easy to add back in.

## X-Content-Type-Options

This HTTP header stops IE9 and below from sniffing files and overriding the `Content-Type` header (MIME type) of a HTTP response. This filter is added by default in [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates).

```cs
filters.Add(new XContentTypeOptionsAttribute());
```

## X-Download-Options

This HTTP header stops the automatic downloading and opening of your HTML pages by browsers which then go on to run the page as if it were part of your site. It and forces the user to save the page and manually open the HTML document. This filter is added by default in [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates).

```cs
filters.Add(new XDownloadOptionsAttribute());
```

## Other HTTP Headers

[NWebSec](https://github.com/NWebsec/NWebsec) provides a number of other useful HTTP headers. The `SetNoCacheHttpHeadersAttribute` helps turn off caching by applying the `Cache-Control`, Expires and Pragma HTTP headers (Expires and Pragma have been superseded by Cache-Control but still need to be applied for backward compatibility).

Another useful filter provided is `XRobotsTagAttribute`. This adds the `X-Robots-Tag` HTTP header, which tells robots (Google or Bing) not to index any action or controller this attribute is applied to. Note, that [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) includes a [robots.txt](http://en.wikipedia.org/wiki/Robots_exclusion_standard) file which you should use instead of this filter but I've added this here for completeness.

A good place to use these attributes would be on a page where you want to post back credit card information because caching credit card information could be a security risk and you probably don't want search engines indexing your checkout pages either.

```cs
public class CheckoutController : Controller
{
    [SetNoCacheHttpHeadersAttribute, XRobotsTagAttribute(NoIndex = true, NoFollow = true)]
    public ActionResult Checkout(CardDetails cardDetails)
    {
        // Checkout customers purchases securely.
    }
}
```

The `CspAttribute` filter adds valuable support for the new `Content-Security-Policy` (CSP) HTTP header. I will be covering this extensively in my next blog post so I've only mentioned it here. There are other HTTP headers but they turn off browser security features and I'm not really sure why you would use those.

# Conclusions

In the image below, you can see the [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) site in action. I've taken a screenshot of the HTTP response headers. You will see the ones listed in this email among them.

![ASP.NET Core Boilerplate HTTP Response Headers](./images/ASP.NET-MVC-Boilerplate-HTTP-Response-Headers.png)

Using HTTP headers for security is just one extra tool in your arsenal to secure your site. As you will see in my next post about the new [Content-Security-Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/Security/CSP) HTTP header, it can be a very powerful tool but not one to be used in isolation. You need to think about security across the whole spectrum of your site to catch all the glaring holes you may have missed.
