Param (
    [Parameter(Mandatory = $true, HelpMessage = "(Required) The title of the post.")]
    [string] $Title,
    [Parameter(Mandatory = $true, HelpMessage = "(Required) The title of the post.")]
    [string] $Description,
    [Parameter(Mandatory = $false, HelpMessage = "(Optional) The author of the post.")]
    [AllowEmptyString()]
    [string] $Author,
    [Parameter(Mandatory = $false, HelpMessage = "(Optional) The name of the series of posts.")]
    [AllowEmptyString()]
    [string] $Series,
    [Parameter(Mandatory = $false, HelpMessage = "(Optional) The order of the series of posts.")]
    [AllowEmptyString()]
    [int] $SeriesOrder)

$Author = '' -eq $Author ? 'Muhammad Rehan Saeed' : $Author;
if ('' -ne $Series) {
    $Series =
"`nseries: ""$($Series)""
seriesOrder: $($SeriesOrder)"
}

$date = Get-Date;
$year = $date.Year;
$timestamp = $date.ToString('yyyy-MM-ddTHH:mm:ssZ');
$slug = $Title.Replace(' ', '-').ToLowerInvariant();
$permalink = '/' + $slug + '/';

$content =
"---
title: ""$($Title)""
description: ""$($Description)""
author: ""$($Author)""
permalink: ""$($permalink)""
heroImage: ""/images/hero/Microsoft-.NET-1366x768.png""
date: ""$($timestamp)""
dateModified: null
published: false$($Series)
categories:
  - """"
tags:
  - """"
---

";

Write-Output $content;

$postDirectoryPath = Join-Path $PSScriptRoot "\content\posts\$($year)\$($slug)";
$imagesDirectoryPath = Join-Path $postDirectoryPath "\images";
$markdownFilePath = Join-Path $postDirectoryPath "index.md";

New-Item -ItemType Directory -Force -Path $imagesDirectoryPath;
Set-Content -Path $markdownFilePath -Value $content;
