---
title: "Custom Project Templates Using dotnet new"
description: "How to create project templates using dotnet new and the template.json file. How to share project templates by creating NuGet packages."
author: "Muhammad Rehan Saeed"
permalink: "/custom-project-templates-using-dotnet-new/"
cover_image: "./images/NET.png"
date: "2017-01-18"
published: true
categories:
  - "Tools"
tags:
  - ".NET"
  - "dotnet"
  - "dotnet new"
  - "NuGet"
  - "Project Template"
---

- [Part 1 - Custom Project Templates Using dotnet new](/custom-project-templates-using-dotnet-new/)
- [Part 2 - dotnet new Feature Selection](/dotnet-new-feature-selection/)
- [Part 3 - Unit Testing dotnet new Templates](/unit-testing-dotnet-new-templates/)

# Current dotnet new

If you run dotnet new today, you can create a simple console app. The command has very few options, including selecting the language you want to use (C#, VB or F#). However, this is all about to change. [Sayed I. Hashimi](https://twitter.com/sayedihashimi) and [Mike Lorbetske](https://twitter.com/mlorbetske) who work at Microsoft in the .NET tooling team have been kind enough to show me what they've been working on with the intention of getting some feedback.

![old dotnet new](./images/first-dotnet-new.png)

# dotnet new3

Microsoft is working on a new version of the dotnet new command with support for installing custom project templates from NuGet packages, zip files or folders. If you head over to the [dotnet/templating](https://github.com/dotnet/templating) GitHub repository you can follow the very simple instructions and try out a fairly complete version of this command which is temporarily called `dotnet new3`. The full `dotnet new` experience is due to be released in conjunction with Visual Studio 2017.

![dotnet new3](./images/dotnet-new3.png)

If you take a look at the screenshot above, you'll notice that there are a lot more options available. You can list all installed project templates and install new ones too.

# Creating New Templates

Creating a new project template involves taking a folder containing your project (Mine is called Api-CSharp) and adding a .`template.config` folder to it containing two files.

![Custom project template example folder structure](./images/Custom-project-template-example-folder-structure.png)

## Template Metadata

The `template.json` file is where you specify metadata about your project template. This metadata is displayed when someone lists their installed project templates. A really basic one looks like this:

```json
{
  "author": "Muhammad Rehan Saeed (RehanSaeed.com)",
  "classifications": [ "WebAPI", "Boxed" ], // Tags used to search for the template.
  "name": "Dotnet Boxed API",
  "identity": "Dotnet.Boxed.Api.CSharp",    // A unique ID for the project template.
  "shortName": "api",                       // You can create the project using this short name instead of the one above.
  "tags": {
    "language": "C#"                        // Specify that this template is in C#.
  },
  "sourceName": "ApiTemplate",              // Name of the csproj file and namespace that will be replaced.
  "guids": [                                // GUID's used in the project that will be replaced by new ones.
    "837bc53e-0271-4e9c-b5b5-c60ea7a7c7b5",
    "113f2d04-69f0-40c3-8797-ba3f356dd812"
  ],
}
```

The templating repositories [Wiki](https://github.com/dotnet/templating/wiki/%22Runnable-Project%22-Templates) page talks about what all of the properties mean in a lot more detail but I've added some basic comments for your understanding.

## Installing Templates

Installing the above template from a folder is as easy as using the install command. You can also install templates from zip files and NuGet packages the same way.

![dotnet new3 install](./images/dotnet-new3-install.png)

## Template NuGet Packages

So how do you create a NuGet package containing a project template that's compatible with dotnet new? I'm assuming you are familiar with creating NuGet packages, if not take a look at the NuGet [documentation](https://docs.microsoft.com/en-gb/nuget/quickstart/create-and-publish-a-package). You can create NuGet packages of your project templates by creating a `Templates.nuspec` file like the one below and placing all of your templates in a content folder beside it. The content folder is a special folder which NuGet understands to contain static files. If you look at the nuspec file below, you'll notice the packageType element. This is a new way to tell NuGet that this NuGet package contains project templates.

```xml
<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2010/07/nuspec.xsd">
  <metadata>
    <id>Boxed.Templates</id>
    <version>1.0.0</version>
    <description>My project description.</description>
    <authors>Muhammad Rehan Saeed (RehanSaeed.com)</authors>
    <packageTypes>
      <packageType name="Template" />
    </packageTypes>
  </metadata>
</package>
```

## There is More!

What I've not told you is that it's possible to add features to your project template that developers can turn on or off based on command line switches a bit like [Yeoman](http://yeoman.io/) does for Node based NPM packages. As many of you will know I already do this in my [ASP.NET Core Boilerplate](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) project template but I came up with my own custom method. `dotnet new` makes this all a lot easier and I'll cover how to do this in a later blog post.

# Why This is Better

Traditionally, to create project templates, you could use Visual Studio to create zip files containing your project template or if you were brave you could create Visual Studio extensions (VSIX) to enable installing them directly into Visual Studio and share them on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/vs).

This new method makes creating project templates about as easy as it's ever going to get and allows really easy sharing, versioning and personalization of project templates. At some point I envisage a website (Possible the Visual Studio Marketplace) where you could go and install these NuGet based project templates.

# .NET Boxed API

I've been working on a brand new project template for building API's using dotnet new with a lot of help from the guys at Microsoft. My project templates are quite complex so it's a good test of the system. The API comes jam packed full of security, performance and best practice features and also implements Swagger right out of the box. You can try installing it with `dotnet new` from [NuGet](https://github.com/Dotnet-Boxed/Templates).

# Conclusions

Overall I'm really impressed with where the new project templating system is headed. It's very easy to do something simple but also very powerful should you need to do something complicated. There is a few blog posts worth of material here, so expect a few more posts in the coming weeks.
