---
title: "A Very Generic .editorconfig File (Updated)"
description: "A .editorconfig file define and maintain consistent coding styles between different editors and IDEs for file with different file extensions."
author: "Muhammad Rehan Saeed"
permalink: "/generic-editorconfig-file/"
cover_image: "./images/hero/A-Very-Generic-Editorconfig-File-1366x768.png"
date: "2017-10-01"
published: true
categories:
  - "Tools"
tags:
  - ".editorconfig"
  - "C#"
  - "C# 7.3"
  - "StyleCop"
  - "Visual Studio"
  - "Visual Studio Code"
---

# What is a .editorconfig File?

A `.editorconfig` file helps developers define and maintain consistent coding styles between different editors and IDEs for file with different file extensions. These configuration files are easily readable and they work nicely with version control systems. An `.editorconfig` file defines various settings per file extension such as charsets and tabs vs spaces.

[Scott Hanselman](https://www.hanselman.com/blog/TabsVsSpacesAPeacefulResolutionWithEditorConfigInVisualStudioPlusNETExtensions.aspx) recently wrote a blog post about this file. You can also find out more from the official docs at [editorconfig.org](http://editorconfig.org/) and the [Visual Studio Docs](https://docs.microsoft.com/en-us/visualstudio/ide/editorconfig-code-style-settings-reference) which I recommend you read.

# A Very Generic .editorconfig

I wrote a generic [.editorconfig](https://github.com/RehanSaeed/EditorConfig/blob/master/.editorconfig) file supporting the following file types:

- C# - .cs, .csx, .cake
- Visual Basic - .vb
- Script - .sh, .ps1, .psm1, .bat, .cmd
- XML - .xml, .config, .props, .targets, .nuspec, .resx, .ruleset
- JSON - .json, .json5
- YAML - .yml,  .yaml
- HTML - .htm, .html
- JavaScript - .js, .ts, .tsx, .vue
- CSS - .css, .sass, .scss, .less
- SVG - .svg
- Markdown - .md
- Visual Studio - .sln, .csproj, .vbproj, .vcxproj, .vcxproj.filters, .proj, .projitems, .shproj
- Makefile

Extensive code style settings for C# and VB.NET have been defined that require the latest C# features to be used. In addition, it sets various more advanced C# style settings. All C# related code styles are consistent with [StyleCop's](https://github.com/DotNetAnalyzers/StyleCopAnalyzers) default styles. You can find our more about the C# code style settings from the official [docs](https://docs.microsoft.com/en-us/visualstudio/ide/editorconfig-code-style-settings-reference) and also in [Kent Boogaart's](http://kent-boogaart.com/blog/editorconfig-reference-for-c-developers) blog post.

# How do I use It?

All you have to do is drop it into the root of your project. Then any time you open a file in Visual Studio, the .editorconfig file settings will be used to help format the document and also raise warnings if your code style and formatting does not conform.

For Visual Studio Code, you can install the [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig) extension to get support.

# Exciting July 2018 Update

I noticed that Microsoft silently released several new C# code style settings. I'm not sure when they were released but they're available in the current Visual Studio 15.7 update. The majority of them are to enforce the use of newer C# 7.3 syntax. I updated my generic `.editorconfig` file to add these new settings with C# 7.3 as the default.

Microsoft also updated their documentation for `.editorconfig` settings pertaining to .NET, so I added links to the docs site, so it's easy to see what each setting does and change it, if it's not to your liking. I've also included a undocumented dozen settings. There is an [open issue](https://github.com/MicrosoftDocs/visualstudio-docs/issues/1070) on GitHub to get them documented, so it's easy to see what they do.

In addition, while I was working on this, I added support for a few more file extensions, including `yaml` (`yml` was already there), `json5` (If you haven't heard of `json5`, [check it out](https://json5.org/)), `cmd` and `bat` (If you haven't switched to PowerShell yet, what are you waiting for).

Finally, Microsoft [announced last week](https://blogs.msdn.microsoft.com/visualstudio/2018/06/26/visual-studio-2017-version-15-8-preview-3/) that the Visual Studio 15.8 update which is currently being released as preview 3 will automatically fix errors when you format the document using the `CTRL+K` followed by `CTRL+D` shortcut. This is huge! It means that you can drop a `.editorconfig` file in an existing codebase and with a few clicks or keyboard shortcuts (if that's how you roll) you can clean up your code base to use the latest C# 7.3 features and a code style that suits you.
