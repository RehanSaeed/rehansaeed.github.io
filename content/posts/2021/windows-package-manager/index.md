---
title: "The Windows Package Manager"
description: "The Windows Package Manager or winget has recently got quite good with the version 1.1 release. Here is my new machine setup script"
author: "Muhammad Rehan Saeed"
permalink: "/windows-package-manager/"
heroImage: "/images/hero/Winget-1600x900.png"
date: "2021-10-12T08:40:00Z"
dateModified: null
published: true
categories:
    - "Tools"
tags:
    - "Windows Package Manager (winget)"
---

Winget is a package manager for Windows a bit like apt for linux or the open source Chocolatey for Windows. Version 1.1 of the Windows Package Manager (winget) was [recently released](https://devblogs.microsoft.com/commandline/windows-package-manager-1-1/). I've had my eye on it for a while now and its only recently gotten good enough to use for real.

It now has the ability to install Windows Store applications and its library of apps that you can search for and install has gotten quite big. My PowerShell script to get a new machine started quickly with all the essential applications that I use as a .NET/Web developer is shown below.

```powershell
# Environment Variables
[System.Environment]::SetEnvironmentVariable('DOTNET_CLI_TELEMETRY_OPTOUT', '1', [EnvironmentVariableTarget]::Machine)

# Windows Features
# List features: Get-WindowsOptionalFeature -Online
Enable-WindowsOptionalFeature -Online -FeatureName 'Containers' -All
Enable-WindowsOptionalFeature -Online -FeatureName 'Microsoft-Hyper-V' -All
Enable-WindowsOptionalFeature -Online -FeatureName 'VirtualMachinePlatform' -All

# Office
winget install --id '9MSPC6MP8FM4' # Microsoft Whiteboard
start "https://github.com/zufuliu/notepad2/releases"

# Utilities
winget install --id '7zip.7zip' --interactive --scope machine
winget install --id 'XP89DCGQ3K6VLD' # Microsoft Power Toys
winget install --id '9NJ3KMH29VGJ' # Enpass
winget install --id 'WinSCP.WinSCP' --interactive --scope machine
winget install --id '9WZDNCRFJ3PV' # Windows Scan

# Pheripherals
winget install --id 'Elgato.ControlCenter' --interactive --scope machine
winget install --id 'Elgato.StreamDeck' --interactive --scope machine

# Browsers
winget install --id 'Google.Chrome' --interactive --scope machine
winget install --id 'Mozilla.Firefox' --interactive --scope machine

# Communication
winget install --id 'Microsoft.Teams' --interactive --scope machine
winget install --id 'OpenWhisperSystems.Signal' --interactive --scope machine
winget install --id '9WZDNCRDK3WP' # Slack
winget install --id '9WZDNCRFJ140' # Twitter
winget install --id 'XP99J3KP4XZ4VV' # Zoom

# Images
winget install --id '9N3SQK8PDS8G' # Screen To Gif
start https://www.getpaint.net/download.html # Paint.NET not yet available on winget

# Media
winget install --id 'XPDM1ZW6815MQM' # VLC
winget install --id 'plex.plexmediaplayer' --interactive --scope machine
winget install --id 'OBSProject.OBSStudio' --interactive --scope machine
winget install --id 'dev47apps.DroidCam' --interactive --scope machine
winget install --id 'XSplit.VCam' --interactive --scope machine

# Terminal
winget install --id 'Microsoft.WindowsTerminal' --interactive --scope machine
winget install --id 'Microsoft.Powershell' --interactive --scope machine
winget install --id 'JanDeDobbeleer.OhMyPosh' --interactive --scope machine
winget install --id '9P9TQF7MRM4R' # Windows Subsystem for Linux Preview
winget install --id '9NBLGGH4MSV6' # Ubuntu
winget install --id '9P804CRF0395' # Alpine

# Git
winget install --id 'Git.Git' --interactive --scope machine
winget install --id 'GitHub.GitLFS' --interactive --scope machine
winget install --id 'GitHub.cli' --interactive --scope machine
winget install --id 'Axosoft.GitKraken' --interactive --scope machine

# Azure
winget install --id 'Microsoft.AzureCLI' --interactive --scope machine
winget install --id 'Microsoft.AzureCosmosEmulator' --interactive --scope machine
winget install --id 'Microsoft.AzureDataStudio' --interactive --scope machine
winget install --id 'Microsoft.AzureStorageEmulator' --interactive --scope machine
winget install --id 'Microsoft.AzureStorageExplorer' --interactive --scope machine

# Tools
winget install --id 'Docker.DockerDesktop' --interactive --scope machine
winget install --id 'Microsoft.PowerBI' --interactive --scope machine
winget install --id 'Telerik.Fiddler' --interactive --scope machine

# IDE's
winget install --id 'Microsoft.VisualStudio.2022.Enterprise' --interactive --scope machine
winget install --id 'Microsoft.VisualStudioCode' --interactive --scope machine

# Frameworks
winget install --id 'OpenJS.NodeJS' --interactive --scope machine
winget install --id 'Microsoft.dotnet' --interactive --scope machine
```

A few of things to note in my script. All apps with random looking ID's like `9P9TQF7MRM4R` are Windows Store applications. Secondly, for non-Windows Store applications I always use the `--interactive` flag because:

> Don’t accept the defaults
> <footer><cite>Abel Wang</cite></footer>

I never want a shortcut added to my desktop, extra toolbars or system tray icons, so never accept the defaults and always manually select the options you want in the installer. Maybe one day we can set the options we want from `winget` itself (we can dream!).

Finally, I set the scope of the installation to `machine` as opposed to `user`. I'm not sure which installers respect this setting but I always want all applications available to whoever is using the machine.
