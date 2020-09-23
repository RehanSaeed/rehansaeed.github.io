---
title: "Automating .NET Security Updates"
description: ".NET SDK updates are released every few weeks. In this post, I talk about how you can automate them."
author: "Muhammad Rehan Saeed"
permalink: "/automating-dotnet-security-updates/"
heroImage: "/images/hero/Microsoft-.NET-1366x768.png"
date: "2020-09-23T15:35:00Z"
dateModified: null
published: true
categories:
    - ".NET"
tags:
    - ".NET"
    - ".NET SDK"
    - "GitHub Actions"
    - "Azure Pipelines"
    - "AppVeyor"
---

Every few weeks Microsoft pushes out a .NET SDK update to patch zero day security vulnerabilities. It's important to keep up to date with these to ensure that your software is protected. The problem is, keeping up to date is a manual and boring process but what if you could automate it?

In this post, I'll talk through how you can get most of the way to a fully automated solution with the last hurdle requiring some of your help.

# Single Source of Truth

The first problem we need to solve is to enforce a specific version of the .NET SDK to be used to build our code. We can do this by adding a `global.json` file to the root of our repository. We can set the .NET SDK version in it like so:

```json
{
  "sdk": {
    "version": "3.1.402"
  }
}
```

::: warning Security vs Convenience
If a developer doesn't have the version of the .NET SDK you've specified in your `global.json` file, Visual Studio will fail to load the projects and show a pretty good error in the output window telling you to update the SDK. It would be nice if it also contained a link to the exact SDK install you needed to smooth the experience.
:::

# Continuous Integration

Continuous integration servers like GitHub Actions, Azure Pipelines or AppVeyor all have a version of the .NET SDK pre-installed for your convenience. However, when a new version is released it takes them days to update to the latest version.

In my opinion, it's just better to install the .NET SDK yourself, which is pretty easy to do. The trick is to read the .NET SDK version number from the `global.json` file, so that there is a single source of truth for the  version number and it's easier to update.

It's worth noting that this adds a few seconds to your build time. However, if the build server already has the version installed which is usually true, it's very quick.

## GitHub Actions

For GitHub Actions, we can use the first party `actions/setup-dotnet` GitHub action to install the .NET SDK. You can provide it a hard coded version number but it turns out omitting this causes it to lookup the version number from any `global.json` file it finds.

```yml
- name: 'Install .NET Core SDK'
  uses: actions/setup-dotnet@v1
```

## Azure Pipelines

Azure Pipelines has a similar first party `UseDotNet` task that can install the .NET SDK. It's a bit more verbose, as you need to set the `useGlobalJson` flag to `true`.

```yml
- task: UseDotNet@2
  displayName: 'Install .NET Core SDK'
  inputs:
    packageType: 'sdk'
    useGlobalJson: true
```

## PowerShell

.NET ships with a PowerShell and Bash script to install the .NET SDK. They both ship with an argument you can pass to tell them to use the `global.json` file to read the version number. Here is a short cross-platform PowerShell 7 (previously known as PowerShell Core) script that you can use:

```powershell
if ($isWindows) {
    Invoke-WebRequest "https://dot.net/v1/dotnet-install.ps1" -OutFile "./dotnet-install.ps1"
    ./dotnet-install.ps1 -JSonFile global.json
}
else {
    Invoke-WebRequest "https://dot.net/v1/dotnet-install.sh" -OutFile "./dotnet-install.sh"
    sudo chmod u+x dotnet-install.sh
    sudo ./dotnet-install.sh --jsonfile global.json
}
```

## AppVeyor

AppVeyor has some issues with installing the .NET SDK using the PowerShell and Bash scripts. For reasons I'm not too clear on, you have to set the installation directory. So here is the updated script I use for that:

```powershell
if ($isWindows) {
    Invoke-WebRequest "https://dot.net/v1/dotnet-install.ps1" -OutFile "./dotnet-install.ps1"
    ./dotnet-install.ps1 -JSonFile global.json -InstallDir 'C:\Program Files\dotnet'
}
else {
    Invoke-WebRequest "https://dot.net/v1/dotnet-install.sh" -OutFile "./dotnet-install.sh"
    sudo chmod u+x dotnet-install.sh
    if ($isMacOS) {
        sudo ./dotnet-install.sh --jsonfile global.json --install-dir '/Users/appveyor/.dotnet'
    } else {
        sudo ./dotnet-install.sh --jsonfile global.json --install-dir '/usr/share/dotnet'
    }
}
```

# Dependabot

[Dependabot](https://github.blog/2020-06-01-keep-all-your-packages-up-to-date-with-dependabot/) is an amazing tool that GitHub recently acquired. It automatically submits pull requests to your repository to update packages of various kinds including NuGet and NPM packages.

This is where I need your help. The Dependabot GitHub repository has an open issue ([dependabot-core#2442](https://github.com/dependabot/dependabot-core/issues/2442)) to also do the same for the .NET SDK version in the `global.json` file. Upvoting the issue will really help raise it's profile and get it implemented.

# Conclusions

Security is hard. Keeping up to date is important but a never ending boring chore. It doesn't have to be that way. With a little extra work, we can get as close to making a .NET SDK update a three character commit every few weeks and with your help, maybe even that can be automated with Dependabot.
