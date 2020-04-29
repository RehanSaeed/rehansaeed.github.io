---
title: "Git Cloning the Windows OS Repo"
description: "My experiences of cloning and working on the Windows OS Git repository."
author: "Muhammad Rehan Saeed"
permalink: "/git-cloning-the-windows-os-repo/"
heroImage: "/images/hero/Windows-1366x768.png"
date: "2019-06-24"
dateModified: null
published: true
categories:
  - "Thoughts"
tags:
  - "Git"
  - "GVFS"
  - "OS"
  - "Windows"
---

::: warning Disclaimer
I'm a Microsoft employee but my opinions in this personal blog post are my own and nothing to do with Microsoft. The information in this blog post is already publicly available and I talk in very general terms.
:::

I recently had the unique opportunity to git clone the Windows OS repository. For me as a developer, I think that has got to be a bucket list (a list of things to do before you die) level achievement!

A colleague who was doing some work in the repo was on leave and the task of completing the job unexpectedly fell on me to finish up. I asked around to see if anyone had any pointers on what to do and I was pointed towards an Azure DevOps project. The first thing I naively tried was running:

```powershell
git clone https://microsoft.fake.com/foo/bar/os
```

This gave me the very helpful error:

> remote: This repository requires GVFS. Ensure the version of git you are using supports GVFS.
> fatal: protocol error: bad pack header

This triggered a memory in the dark recesses of my mind about [GVFS (Git Virtual File System)](https://devblogs.microsoft.com/devops/announcing-gvfs-git-virtual-file-system/). The Windows OS repository is around 250GB in size. When you consider that there are tens or maybe hundreds of developers committing changes every day, you are not going to have a very pleasant developer experiences if you just used Git and tried to pull all 250GB of files. So GVFS abstracts away the file system and only downloads files when you try to access them.

The Windows OS has a very large and thorough internal Wiki. This wiki has sections covering all areas of the Windows OS going back for years. After a short time searching the wiki I discovered a very thorough getting started guide for new developers.

The getting started guide involves running some PowerShell files which install a very specific but recent version of Git and setting up GVFS. Interestingly, you can also optionally point your Git client at a cache server to speed up git commands. There are a few cache servers all over the world to choose from. Finally, there is a VS Code extension specific to the OS repo that gives you some extra intelli-sense, very fancy.

Even though pulling the code using GVFS should in theory only pull what you need at any given time, it still took a fair amount of time to get started. Standard git commands still worked but took tens of seconds to execute, so you had to be pretty sure of what you were doing.

At this point a colleague warned against using 'find in files', as this would cause GVFS to pull all files to disk. I think search would do the same. An alternative approach I used instead was to search via the Azure DevOps website where you can view all files in any repo.

Once I'd had a chance to have a root around the repo, I realised that it was probably the largest folder structure I'd ever seen. There are many obscure sounding folders like 'ds' and 'net'. The reason for the wiki's existence became clear.

Other random things I found was that the repo contains an 'src' folder just like a lot of other repositories. There is a tonne of file extensions I've never seen or heard of before and there are binaries checked into the repo which seems suboptimal on the face of it. I even found the `Newtonsoft.Json` binary in there.

I was pleasantly surprised to see an `.editorconfig` file in the repo. It turns out that spaces are preferred over tabs and line endings are CRLF (I don't know what else I expected).

There is a tools folder with dozens of tools in it. In fact, I had to use one of these tools to get my job done. The tool I used was a package manager a bit like NuGet. You can use a CLI tool to version and upload a folder of files. This made sense. The OS repo does not a mono repo in that it doesn't contain every line of code in Windows. There are many other repositories that package up and upload their binaries using this tool.

Some further reading on this package manager and I discovered that the Windows OS does some de-duplication of files to save space. I'm guessing they still have to fit Windows onto a DVD (How quaint, do people still use DVD's?), so file size is important.

While trying to figure out how to use the package manager, I accidentally executed a search through all packages. Text came streaming down the page like in the Matrix. Eventually I managed to fumble the right keys on the keyboard to cancel the search.

Once I'd finished with my changes I checked in and found that I had to rebase because newer commits were found on the server. I re-based as normal, except for the very long delay in executing git commands.

Once I'd finally pushed the branch containing my changes up to the server, I created a pull request in Azure DevOps. As soon as I'd done that, I got inundated with emails from Azure Pipelines telling me that a build had started and various reviewers had been added to my pull request.

The Azure Pipelines build only took 25 minutes to complete. A quick look shows a bunch of builds with five hours or more. I'm guessing that my changes had only gone through a cursory initial build to make sure nothing was completely broken.

A few days later I got a notification telling me my pull request had been merged. All I did was change a few config files and upload a package or two, but it was an interesting experience none the less.
