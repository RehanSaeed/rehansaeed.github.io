---
title: ".NET Boxed"
description: ".NET Boxed is a set of project templates with batteries included, providing the minimum amount of code required to get you going faster."
author: "Muhammad Rehan Saeed"
permalink: "/net-boxed/"
cover_image: "./images/hero/Dotnet-Boxed-1366x768.png"
date: "2018-05-13"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET Boxed"
  - ".NET Core"
  - "API"
  - "ASP.NET Core"
  - "ASP.NET Core Boilerplate"
  - "GraphQL"
  - "Swagger"
---

[.NET Boxed](https://github.com/Dotnet-Boxed/Templates) is a set of project templates with batteries included, providing the minimum amount of code required to get you going faster. Right now it includes API and GraphQL project templates.

![.NET Boxed Icon](./images/Icon-512x512-150x150.png)

# ASP.NET Core API Boxed

The default [ASP.NET Core API Boxed](https://github.com/Dotnet-Boxed/Templates/blob/master/Docs/API.md) options will give you an API with [Swagger](https://swagger.io/), ASP.NET Core versioning, HTTPS and much more enabled right out of the box. You can totally turn any of that off if you want to, the point is that it's up to you.

![ASP.NET Core API Boxed Preview](./images/API-Preview.png)

# ASP.NET Core GraphQL Boxed

If you haven't read about or learned [GraphQL](http://graphql.org/) yet, I really suggest you go and follow their short online tutorial. It's got some distinct advantages over standard REST'ful API's (and some disadvantages but in my opinion the advantages carry more weight).

Once you've done that, the next thing I suggest you do is to create a project from the [ASP.NET Core GraphQL Boxed](https://github.com/Dotnet-Boxed/Templates/blob/master/Docs/GraphQL.md) project template. It implements the GraphQL specification using [GraphQL.NET](https://github.com/graphql-dotnet/graphql-dotnet) and a few other NuGet packages. It also comes with a really cool GraphQL playground, so you can practice writing queries, mutations and subscriptions.

![ASP.NET Core GraphQL Boxed Preview](./images/GraphQL-Preview.png)

This is the only GraphQL project template that I'm aware of at the time of writing and it's pretty fully featured with sample queries, mutations and subscriptions.

# ASP.NET Core Boilerplate

.NET Boxed used to be called ASP.NET Core Boilerplate. That name was kind of forgettable and there was another great project that had a very similar name. I put off renaming for a long time because it was too much work but I finally relented and got it done.

In the end I think it was for the best. The new [.NET Boxed](https://github.com/Dotnet-Boxed/Templates) branding and logo are much better and I've opened it up to .NET project templates in general, instead of just ASP.NET Core project templates.

Thanks to [Jon Galloway](https://twitter.com/jongalloway) and [Jason Follas](https://twitter.com/jfollas) for helping to [work out the branding](https://twitter.com/jongalloway/status/991342926067154945).

# How can I get it?

1. Install the latest .NET Core SDK.
2. Run `dotnet new --install "Boxed.Templates::*"` to install the project template.
3. Run `dotnet new api --help` to see how to select the feature of the project.
4. Run `dotnet new api --name "MyTemplate"` along with any other custom options to create a project from the template.

# Boxed Updates

There are new features and improvements planned on the GitHub [projects](https://github.com/Dotnet-Boxed/Templates/projects) tab. ASP.NET Core 2.1 is coming out soon, so look out for updates which you can see in the GitHub [releases](https://github.com/Dotnet-Boxed/Templates/releases) tab when they go live.
