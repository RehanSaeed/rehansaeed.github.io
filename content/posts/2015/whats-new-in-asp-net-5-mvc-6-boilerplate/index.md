---
title: "Whats New in ASP.NET Core Boilerplate"
description: "With the release of ASP.NET Core Boilerplate, this post discusses what's new and what is currently missing due to ASP.NET Core still being in beta."
author: "Muhammad Rehan Saeed"
permalink: "/whats-new-in-asp-net-5-mvc-6-boilerplate/"
heroImage: "/images/hero/ASP.NET-Core-Boilerplate-1366x768.png"
date: "2015-08-23"
dateModified: null
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET MVC"
  - "ASP.NET Core Boilerplate"
  - "C#"
  - "GitHub"
---

I have just updated the [ASP.NET Core Boilerplate](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) Visual Studio extension with a new project template targeting ASP.NET Core. This post is just a quick one to talk about what's new and different about this version of the template compared to the ASP.NET 4.6 MVC 5 version.

# What's New

Well, the obvious thing is that this template targets ASP.NET Core which is currently still in beta. In particular I am targeting Beta 6 which is the current stable version. I will be regularly updating the template with each new beta until ASP.NET Core is released sometime in November according to Microsoft.

There are not too many new improved features over the ASP.NET 4.6 MVC 5 version but here is a quick description:

1. Performance improvements derived from using ASP.NET Core. ASP.NET Core is much improved and no longer uses `System.Web`, so it uses a lot less memory.
2. Using [NPM](https://www.npmjs.com/) and [Bower](http://bower.io/) to get CSS and JavaScript scripts rather than NuGet. This means you have a lot more choice and get the latest versions straight from the source.
3. Switched from [LESS](http://lesscss.org/) to [SASS](http://sass-lang.com/) for CSS. This decision was made because SASS seems to be more popular and the upcoming Bootstrap 4 has also made the same decision.
4. [Gulp](http://gulpjs.com/) is used instead of the standard ASP.NET 4.6 bundling and minification feature. Not only that but Gulp is also configured to optimize images, rebuild CSS and JavaScript on file change, lint the CSS and JavaScript for common errors and warnings and measure the speed of your site using Google Page Speed.
5. The default ASP.NET Core project template uses [Bootstrap-Touch-Carousel](https://github.com/ixisio/bootstrap-touch-carousel) and [Hammer.js](https://hammerjs.github.io/) for a nice touch friendly carousel control on the home screen.
6. There is now a single controller action responsible for displaying errors. This is a lot simpler and a great improvement over MVC 5.
7. The logging and caching services are now built into ASP.NET Core, so we use them instead.

# What's Missing

ASP.NET Core is still in beta and there are a lot of third party libraries that don't yet support it. Support will be added as soon as it becomes available. I have contacted all three project owners and can confirm that support will be added soon.

- [NWebSec](https://github.com/NWebsec/NWebsec)
- [Elmah](https://code.google.com/p/elmah/)
- [Glimpse](http://getglimpse.com/)

The new .NET Core runtime does not currently support the `System.ServiceModel.Syndication` namespace which is used to build an Atom feed. The .NET Core runtime is still being targeted but the Atom feed will not work and is excluded using `#if` pre-processor directives. I have raised this issue on the .NET teams GitHub page [here](https://github.com/dotnet/wcf/issues/76#issuecomment-133461504). Please do go ahead and show your support for the feature.

There are other issues around ASP.NET Core missing features from MVC 5 including no support for `HttpException` which I will be looking into adding soon. I am also looking into submitting any improvements I make to the ASP.NET Core GitHub project, so far, I've had one pull request accepted and a few suggestions acted on.

# Conclusions

ASP.NET Core is still in beta but hopefully this project will give an understanding of what can be done with it. There are still missing features but it's surprisingly usable at the moment.
