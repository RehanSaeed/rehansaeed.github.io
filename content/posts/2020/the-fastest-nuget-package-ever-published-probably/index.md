---
title: "The Fastest NuGet Package Ever Published (Probably)"
description: "The fastest way to create a new NuGet package project and get it published with all the bells and whistles like continuous integration (CI) builds and drafted release notes."
author: "Muhammad Rehan Saeed"
permalink: "/the-fastest-nuget-package-ever-published-probably/"
heroImage: "/images/hero/NuGet-1366x768.png"
date: "2020-07-08T08:34:00Z"
dateModified: "2021-04-12T09:50:00Z"
published: true
categories:
  - ".NET"
tags:
  - "NuGet"
  - "GitHub"
  - "GitHub Actions"
  - ".NET Boxed"
---

::: tip Updated 2022-03-30 22:42
The GitHub CLI added support for creating labels, so updated the post with those new commands.
:::

::: tip Updated 2021-04-12 09:50
I appeared on the [.NET Docs Show](https://dotnet.microsoft.com/live/dotnet-docs) and ran through this blog post and much more. I've added a [link to the show](https://www.youtube.com/watch?v=A93Fn_qMLX4) on YouTube below.
:::

::: tip Updated 2020-09-17 09:29
Added GitHub CLI commands to create labels instead of doing it manually. The GitHub CLI also simplified some commands, so I've updated the post to make use of those simpler commands.
:::

https://www.youtube.com/watch?v=A93Fn_qMLX4

So, you want to publish a new NuGet package? You just want to get your code up into nuget.org as quickly as possible but there is so much that you have to setup to get there. Not any more! I'll show you how you can create a new project and publish a NuGet package with all the bells and whistles in a **couple of minutes**.

We'll start off by creating a new GitHub repository using the new [GitHub CLI](https://github.com/cli/cli).

```powershell
gh repo create RehanSaeed/FastestNuGet --public --confirm
cd FastestNuGet
```

The next step is to install the [Dotnet Boxed](https://github.com/Dotnet-Boxed/Templates) project templates and then create a new project using the [NuGet template](https://github.com/Dotnet-Boxed/Templates/blob/main/Docs/NuGet.md). There is a **lot** of optional features you can toggle in this project template which you can review by looking at the output for the `dotnet new nuget --help` command.

```powershell
dotnet new --install Boxed.Templates
dotnet new nuget --help
dotnet new nuget --title "Project Title" --description "Project Description" --github-username RehanSaeed --github-project FastestNuGet
```

Next we'll commit and push our newly created project to the `main` branch.

```powershell
git add .
git commit -m "Initial"
git push --set-upstream origin main
```

As soon as we do this, we'll see two GitHub Actions have started.

![GitHub Actions](./images/GitHub-Actions-1062x551.png)

The `Build` GitHub Action has completed several actions you can see below. Note that these actions were completed on Windows, MacOS and Ubuntu Linux. This ensures that your code builds and passes tests on all platforms.

![Build GitHub Action](./images/Build-GitHub-Action-1062x700.png)

This resulted in a NuGet package being packaged up and pushed to GitHub packages. This is a nice place to store pre-release packages that you can use for testing.

![GitHub Packages](./images/GitHub-Packages-1062x551.png)

The other `Release Drafter` GitHub action created a draft release for us in GitHub releases.

![GitHub Releases](./images/GitHub-Releases-1062x600.png)

Next we need to create some default labels that we can apply to pull requests. This will help us create automatic release notes for any NuGet packages we release. The `bug`, `enhancement` and `maintenance` labels will categorise changes in our release notes. The `major`, `minor` and `patch` labels will automatically generate a semantic versioning 2.0 compliant version number for us.

![GitHub Labels](./images/GitHub-Labels-1106x756.png)

I've gone in to GitHub and deleted all the existing labels and then run a few GitHub CLI commands to create just the ones I want:

```powershell
gh label create "dependencies" --description "Pull requests that update a dependency file." --color "0366d6"
gh label create "documentation" --description "Pull requests or issues to add or modify documentation." --color "0075ca"
gh label create "bug" --description "Issues describing a bug or pull requests fixing a bug." --color "ee0701"
gh label create "enhancement" --description "Issues describing an enhancement or pull requests adding an enhancement." --color "a2eeef"
gh label create "maintenance" --description "Pull requests that perform maintenance on the project but add no features or bug fixes." --color "fff89b"
gh label create "major" --description "Pull requests requiring a major version update according to semantic versioning." --color "b23021"
gh label create "minor" --description "Pull requests requiring a minor version update according to semantic versioning." --color "f99248"
gh label create "patch" --description "Pull requests requiring a patch version update according to semantic versioning." --color "eaf42c"
```

Now it's time to make a change and submit a new pull request (PR) to our repository. Notice I'm adding a `major` and `enhancement` label to the pull request.

```powershell
git switch --create some-change
git add .
git commit -m "Some change"
git push --set-upstream origin some-change
gh pr create --fill --label major --label enhancement
```

Next, I'll check that the pull request passed all eight of it's continuous integration build checks and merge the pull request.

![Completed Pull Request](./images/Completed-Pull-Request-1106x756.png)

If we go back to GitHub Releases, we'll see that our draft GitHub release was automatically updated with details of our pull request! Notice that the `enhancement` label also caused our pull request to be categorised under 'New Features'.

![GitHub Releases](./images/Pull-Request-GitHub-Releases-1106x756.png)

Next, we'll want to publish an official release of our NuGet package to [nuget.org](https://www.nuget.org) but first, we need to get hold of a NuGet API key from nuget.org and add it as a secret named `NUGET_API_KEY` in GitHub secrets.

![GitHub Secrets](./images/GitHub-Secrets-1062x600.png)

Finally I'll edit the release and change the tag name and display name for the release to `1.0.0`. Normally, the `major`, `minor` and `patch` labels we applied earlier would generate this version for us but this is the first ever Git tag, so we'll need to do it ourselves.

In my last post '[The Easiest Way to Version NuGet Packages](https://rehansaeed.com/the-easiest-way-to-version-nuget-packages/)' I talked more about how we are using MinVer for taking the Git tags and versioning our DLL's and NuGet packages.

![Published GitHub Release](./images/Published-GitHub-Release-1106x756.png)

Now bask in the glory of seeing your NuGet package on nuget.org. I also just noticed there is a Black Lives Matter (BLM) banner on the site! Those lives certainly do matter, check out my recent post on [Racism in Software Development and Beyond](https://rehansaeed.com/racism-in-software-development-and-beyond/) for my take on the subject.

![NuGet](./images/NuGet-1064x848.png)

That's not all! We didn't just push one NuGet package, we also pushed it's symbols to the nuget.org symbol server. The NuGet package is also signed and has [source link](https://docs.microsoft.com/en-us/dotnet/standard/library-guidance/sourcelink) support, so developers can debug code in your NuGet package. If you look at the main ReadMe of your project, you'll see a badge showing you the status of the latest GitHub Action run on the main branch and finally you also see a graph showing you how long each GitHub Action run took and it's status over time.

![Main ReadMe](./images/Main-ReadMe-1065x652.png)

You can take a look at the repository at [RehanSaeed/FastestNuGet](https://github.com/RehanSaeed/FastestNuGet) to see all of the above in action.

# The Complete Script

Here is the complete script we ran to get from starting a new project to publishing on NuGet. I took lots of screenshots along the way but overall, you can do all this in about two minutes assuming you have everything installed.

```powershell
gh repo create RehanSaeed/FastestNuGet --public --confirm
cd FastestNuGet

dotnet new --install Boxed.Templates
dotnet new nuget --title "Project Title" --description "Project Description" --github-username RehanSaeed --github-project FastestNuGet

git add .
git commit -m "Initial"
git push --set-upstream origin main

# View GitHub Actions Continuous Integration Build
start "https://github.com/RehanSaeed/FastestNuGet/actions"

# View NuGet Package Published to GitHub Packages
start "https://github.com/RehanSaeed/FastestNuGet/packages"

# Create major, minor, patch, bug, enhancement, maintenance labels
start "https://github.com/RehanSaeed/FastestNuGet/labels"
gh label create "dependencies" --description "Pull requests that update a dependency file." --color "0366d6"
gh label create "documentation" --description "Pull requests or issues to add or modify documentation." --color "0075ca"
gh label create "bug" --description "Issues describing a bug or pull requests fixing a bug." --color "ee0701"
gh label create "enhancement" --description "Issues describing an enhancement or pull requests adding an enhancement." --color "a2eeef"
gh label create "maintenance" --description "Pull requests that perform maintenance on the project but add no features or bug fixes." --color "fff89b"
gh label create "major" --description "Pull requests requiring a major version update according to semantic versioning." --color "b23021"
gh label create "minor" --description "Pull requests requiring a minor version update according to semantic versioning." --color "f99248"
gh label create "patch" --description "Pull requests requiring a patch version update according to semantic versioning." --color "eaf42c"

git switch --create some-change
git add .
git commit -m "Some change"
git push --set-upstream origin some-change
gh pr create --fill --label major --label enhancement

# View and Complete Pull Request
start "https://github.com/RehanSaeed/FastestNuGet/pull/1"

# Add NUGET_API_KEY to GitHub Secrets
start "https://github.com/RehanSaeed/FastestNuGet/settings/secrets"

# View and Publish Updated Draft Release
start "https://github.com/RehanSaeed/FastestNuGet/releases"

# View NuGet Package Published to NuGet
start "https://www.nuget.org/packages/FastestNuGet/"
```

# Conclusions

I hope this [Dotnet Boxed](https://github.com/Dotnet-Boxed/Templates) project template accelerates development of your next NuGet package. There are lots of optional features of the [NuGet project template](https://github.com/Dotnet-Boxed/Templates/blob/main/Docs/NuGet.md) I haven't even shown like support for Azure Pipelines and Appveyor continuous integration builds and more, so please do go and take a look.
