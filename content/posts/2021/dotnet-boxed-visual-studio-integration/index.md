---
title: ".NET Boxed Visual Studio Integration"
description: "You can now create .NET Boxed projects directly from Visual Studio. Here's a short post showing you how."
author: "Muhammad Rehan Saeed"
permalink: "/dotnet-boxed-visual-studio-integration/"
heroImage: "/images/hero/Visual-Studio-1366x768.png"
date: "2021-05-27T11:00:00Z"
dateModified: null
published: true
categories:
  - "Open Source"
tags:
  - ".NET Boxed"
  - "C#"
  - ".NET"
  - "ASP.NET"
---

A few weeks ago [Scott Hanselman blogged](https://www.hanselman.com/blog/dotnet-boxed-includes-prescriptive-templates-for-net-core) about creating `dotnet new` based projects directly from Visual Studio. Unfortunately, at that time Visual Studio 16.9 didn't properly support full solution templates and only supported project templates.

Happily, Microsoft just released [Visual Studio 16.10](https://devblogs.microsoft.com/visualstudio/visual-studio-2019-v16-10-and-v16-11-preview-1-are-available-today/) and one of the things they didn't talk about was that it now adds a user interface for creating solutions from `dotnet new` templates.

Given that I author the [.NET Boxed](https://github.com/Dotnet-Boxed/Templates) solution and item templates, I thought I'd run through how it's done.

# Step by Step

The first step is to install a `dotnet new` based solution/project/item template NuGet package. Sadly, this step is still command line only but there are plans to add a UI so you can search for and install templates all through Visual Studio.

```powershell
dotnet new --install Boxed.Templates
```

Next we can fire up Visual Studio and go to the 'New Project' dialogue. You can select '.NET Boxed' from the 'Project type' menu on the top right to see all .NET Boxed project templates.

![Visual Studio new project dialogue](./images/NewProject-1536x1020.png)

The next step is where we can give the project a name as usual and decide where we want to store it on disk.

![Visual Studio configure project dialogue](./images/ConfigureProject-1536x1020.png)

Finally, we get to the new interesting bit, where we can select from the many options that .NET Boxed templates provide:

![Visual Studio additional information dialogue](./images/AdditionalInformation-1536x1942.png)

Finally, we can hit 'Create' and start getting productive in Visual Studio.

![New Visual Studio solution](./images/VisualStudio-2256x1455.png)

That's it! Simple isn't it.
