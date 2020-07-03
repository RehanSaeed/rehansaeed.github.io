---
title: "The Fastest Way to Publish a NuGet Package"
description: ""
author: "Muhammad Rehan Saeed"
permalink: "/the-fastest-way-to-publish-a-nuget-package/"
heroImage: "/images/hero/NuGet-1366x768.png"
date: "2020-06-30"
dateModified: null
published: false
categories:
  - ".NET"
tags:
  - "NuGet"
  - "GitHub"
  - "GitHub Actions"
---

```powershell
gh repo create RehanSaeed/FastestNuGet --public
cd FastestNuGet
dotnet new --install Boxed.Templates
dotnet new nuget --github-username RehanSaeed --github-project FastestNuGet
git add .
git commit -m "Initial"
git push --set-upstream origin master

# Published to GitHub Packages
start https://github.com/RehanSaeed/FastestNuGet/packages

# Add NUGET_API_KEY to GitHub secrets
git tag -a 0.0.1 -m "Initial"
git push --tags

# Published to NuGet
start https://www.nuget.org/packages/FastestNuGet/
```

![GitHub-Secrets-2256x1010.jpg](GitHub-Secrets-2256x1010.jpg)
