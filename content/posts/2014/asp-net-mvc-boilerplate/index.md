---
title: "ASP.NET Core Boilerplate"
description: "ASP.NET Core Boilerplate is a professional ASP.NET MVC template for building secure, fast, robust and adaptable web applications or sites."
author: "Muhammad Rehan Saeed"
permalink: "/asp-net-mvc-boilerplate/"
cover_image: "/images/hero/ASP.NET-Core-Boilerplate-1366x768.png"
date: "2014-11-12"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET MVC"
  - "ASP.NET Core Boilerplate"
  - "Autofac"
  - "Bootstrap"
  - "C#"
  - "Content Security Policy (CSP)"
  - "Elmah"
  - "Font Awesome"
  - "GitHub"
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

[ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) is a professional ASP.NET MVC template for building secure, fast, robust and adaptable web applications or sites. It provides the minimum amount of code required on top of the default MVC template provided by Microsoft.

![New Project](./images/New-Project.png)

The main benefits of using this template are:

- Security
- Performance
- Search Engine Optimization (SEO)
- Accessibility
- Browser Compatibility
- Resilience and Error Handling
- Easier Debugging and Performance Testing Tools
- Patterns and Practices
- Atom Feed
- Search
- Social Media Support

# ASP.NET 4.6 MVC 5 and ASP.NET Core Support

Two templates are provided. One for ASP.NET 4.6 MVC 5 and another ASP.NET Core template which is currently under development and is missing some features due to ASP.NET Core still being in Beta. For more information about what's new in the ASP.NET Core template, see [here](/whats-new-in-asp-net-5-mvc-6-boilerplate/).

### MVC 5 Technology Map

![ASP.NET Core Boilerplate Technology Map](./images/Technology-Map-1024x380.png)]

### ASP.NET Core Technology Map

![ASP.NET Core Technology Map](./images/MVC-6-Technology-Map.png)

# Why Do I Need It?

The default MVC template that Visual Studio gives you does not make best use of the tools available. It's insecure, slow, and really has a very basic feature list (That's the point of it). [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) provides you with a few more pieces of the puzzle to get you started quicker. It makes liberal use of comments and even gives you a check-list of tasks which you need to perform to make it even better.

The rest of this article is going to briefly go through the improvements made over using the default MVC template. I'll then finish up with instructions on how you can use it. Also, look out for more posts in the future, where I will go through each feature in detail.

## Secure By Default

The default MVC template is not as secure as it could be. There are various settings (Mostly in the web.config file) which are insecure by default. For example, it leaks information about which version of IIS you are using and allows external scripts to access cookies by default!

[ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) makes everything secure by default but goes further and uses various HTTP headers which are sent to the browser to restrict things further.

It also makes use of the new [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/Security/CSP/Introducing_Content_Security_Policy%20) HTTP Header using the [NWebSec](https://nwebsec.codeplex.com/) NuGet packages. CSP revolutionizes web security and I highly recommend reading the above link.

Setting up [SSL](http://en.wikipedia.org/wiki/SSL)/[TLS](http://en.wikipedia.org/wiki/Transport_Layer_Security), so that your site runs over HTTPS is made easy with easy step by step instructions and links.

## Fast By Default

The default MVC template does a pretty poor job in the performance department. Probably because they don't make any assumptions about which web server you are using. Most of the world and dog that are writing ASP.NET MVC sites use IIS and there are settings in the web.config file under the system.webServer section which can make a big difference when it comes to performance.

[ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) makes no such assumptions. It turns on GZip compression for static and dynamic files being sent to the browsers making them smaller and quicker to download. It also uses Content Delivery Networks (CDN) by default to make common scripts like jQuery quicker to download (You can turn this off of course but the point is [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) is fast by default).

That's not all! There are a bunch of other tweaks and examples of practices which can help improve the performance of the site. [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) achieves a score of 96/100 on [YSlow](http://yslow.org/) (Its not possible to get the full 100 as some of it's criteria contradict each other and site scripts need to be moved to a CDN).

## Search Engine Optimization (SEO)

The default ASP.NET MVC template takes no consideration of Search Engine Optimization at all. ASP.NET Core Boilerplate adds a dynamically generated robots.txt file to tell search engines which pages they can index. It also adds a dynamically generated sitemap.xml file where you can help search engines even further by giving them links to all your pages.

ASP.NET MVC has some very useful settings for appending trailing slashes to URL's and making all URL's lower case. Unfortunately, both of these are turned off by default, which is terrible for SEO. This project turns them on by default.

It also includes an MVC filter which helps to redirect non-canonical URL's (URL's without a trailing slash or mixed case characters which are considered different URL's by search engines) to their canonical equivalent.

## Accessibility

4% of the world population is estimated to be visually impaired, while 0.55% are blind. Get more statistics [here](http://www.sitepoint.com/how-many-users-need-accessible-websites). ASP.NET Core Boilerplate ensures that your site is accessible by adding aria attributes to your HTML mark-up and special short-cuts for people using screen readers.

## Browser Compatibility

Websites need to reach as many people as possible and look good on a range of different devices. [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) supports browsers as old as IE8 (IE8 still has around 4% market share and is mostly used by corporations too lazy to port their old websites to newer browsers).

[ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) also supports devices other than desktop browsers as much as possible. It has default icons and splash screens for Windows 8, Android, Apple Devices and a few other device specific settings included by default.

## Resilience and Error Handling

At some point your site is probably going to throw an exception and you will need to handle and log that exception to be able to understand and fix it. [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) includes [Elmah](https://code.google.com/p/elmah/), the popular error logging addin. It's all preconfigured and ready to use.

[ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) uses popular Content Delivery Networks (CDN) from Google and Microsoft but what happens in the unlikely event that these go down? Well, [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) provides backups for these.

Not only that but standard error pages such as 500 Internal Server Error, 404 Not Found and many others are built in to the template. ASP.NET Core Boilerplate even includes IIS configuration to protect you from [Denial-of-Service](http://en.wikipedia.org/wiki/Denial-of-service_attack) (DoS) attacks.

## Easier Debugging and Performance Testing Tools

[ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) makes use of [Glimpse](http://getglimpse.com/) (As [advertised](http://www.hanselman.com/blog/IfYoureNotUsingGlimpseWithASPNETForDebuggingAndProfilingYoureMissingOut.aspx) by Scott Hanselman). It's a great tool to use as you are developing, to find performance problems and bugs. Of course, Glimpse is all preconfigured, so you don't need to lift a finger to install it.

## Patterns and Practices

Doing things right does sometimes take a little extra time. Using the [Inversion of Control (IOC)](http://martinfowler.com/articles/injection.html) pattern for example should be a default. [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) uses the [Autofac](http://autofac.org/) IOC container by default. Some people get a bit tribal when talking about IOC containers but to be honest, they all work great. I picked Autofac because it has lots of helpers for ASP.NET MVC and Microsoft even uses it for Azure Mobile Services.

[ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) also makes use of the popular [LESS](http://lesscss.org/) files for making life easier with CSS. For an example, it can make overriding colours and fonts in the default Bootstrap CSS a cinch.

ASP.NET MVC is a complicated beast. You can end up with lots of [magic strings](http://en.wikipedia.org/wiki/Magic_string%20) which can be a nightmare when renaming something. There are many ways of eliminating these magic strings but most trade maintainability for slower performance. [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) makes extensive use of constants which are a trade-off between maintainability and performance, giving you the best of both worlds.

## Atom Feed

An [Atom 1.0](http://atomenabled.org/developers/syndication/) has been included by default. Atom was chosen over RSS because it is the [better and newer](http://www.intertwingly.net/wiki/pie/Rss20AndAtom10Compared) specification. [PubSubHubbub](https://github.com/pubsubhubbub) 0.4 support has also been built in, allowing you to push feed updates to subscribers.

## Search

There is a lot more to implementing search in your application than it sounds. [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) includes a search feature by default but leaves it open for you to choose how you want to implement it. It also implements [Open Search](http://www.opensearch.org) XML right out of the box. Read Scott Hanselman talk about this feature [here](http://www.hanselman.com/blog/CommentView.aspx?guid=50cc95b1-c043-451f-9bc2-696dc564766d#commentstart).

## Social Media Support

[Open Graph](http://ogp.me/) meta tags and [Twitter Card](https://dev.twitter.com/cards/overview) meta tags are included by default. Not only that but ASP.NET Core Boilerplate includes fully documented HTML helpers that allow you to easily generate Open Graph object or Twitter Card meta tags easily and correctly.

## How can I get it?

That's easy, just choose one of the following options:

1. Get the Visual Studio 2013 extension [here](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) and in Visual Studio go to `File -> New Project -> Web`.
2. Clone the git repository:
    ```powershell
    git clone https://github.com/Dotnet-Boxed/Templates
    ```    

## Release Notes and To-Do List

You can find release notes for each version [here](https://github.com/Dotnet-Boxed/Templates/blob/master/Source/Boilerplate.Vsix/Release%20Notes.txt) and a To-Do list of new features and enhancements coming soon [here](https://github.com/Dotnet-Boxed/Templates/blob/master/TODO.md).

## Bugs and Issues

Please report any bugs or issues on the GitHub issues page [here](https://github.com/Dotnet-Boxed/Templates/issues).

## Future of the project

At some point, I will try to create a [Visual Studio Deployment package (VSIX)](//msdn.microsoft.com/en-us/library/ff363239.aspx) and list this project template on the [Visual Studio extensions](https://visualstudiogallery.msdn.microsoft.com/site/search?f[0].Type=RootCategory&f[0].Value=templates&f[0].Text=Templates&f[1].Type=SubCategory&f[1].Value=aspnet&f[1].Text=ASP.NET) site. To use the template, it will be as easy as choosing ASP.NET Core Boilerplate from the online templates in the File -> New Project -> Online Template menu. Unbelievably, it's actually pretty complicated to create one of these. I found the [Export Template Wizard](https://visualstudiogallery.msdn.microsoft.com/57320b20-34a2-42e4-b97e-e615c71aca24) Visual Studio extension which can do this easily but it's not been updated since Visual Studio 2010.

I am also taking a look at creating separate Visual Studio templates which include ASP.NET Web API and OAuth authentication. This is of course an open source project, I fully expect contributions and suggestions from the community.
