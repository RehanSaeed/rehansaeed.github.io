---
title: "WPF Metro Part 3 - Elysium"
description: "Elysium is an excellent Windows Presentation Foundation (WPF) SDK (On CodePlex) providing Metro styles for built in WPF controls and some custom controls."
author: "Muhammad Rehan Saeed"
permalink: "/wpf-metro-part3-elysium/"
cover_image: "/images/hero/Elysium-1366x768.png"
date: "2014-03-17"
published: true
categories:
  - "Windows Presentation Foundation (WPF)"
tags:
  - ".NET"
  - "C#"
  - "Elysium"
  - "Metro"
  - "Modern"
  - "SDK"
  - "UI"
  - "User Interface"
  - "Windows Presentation Foundation"
  - "WPF"
---

- [WPF Metro Part 1 - Modern UI for WPF](/wpf-metro-part1-modern-ui-for-wpf/)
- [WPF Metro Part 2 - MahApps Metro](/wpf-metro-part2-mahapps-metro/)
- [WPF Metro Part 3 - Elysium](/wpf-metro-part3-elysium/)
- [WPF Metro Part 4 - Elysium Extra](/wpf-metro-part4-elysium-extra/)

https://www.youtube.com/watch?v=YChJguA6ai8

In these series of posts I'm going to do a quick review of a few different open source WPF Metro (Or Modern if you prefer) style SDK's. Each of them provides styles and new controls to build your WPF application from scratch. Here are the home pages for the open source projects in question where you can download the source code and the binaries to play with them yourself:

- [Modern UI for WPF](https://mui.codeplex.com/)
- [MahApps Metro](https://github.com/MahApps)
- [Elysium](https://elysium.codeplex.com/)
- [Elysium Extra](https://github.com/RehanSaeed/Elysium-Extra)

# Elysium

This is the third post in the series. I've been using Elysium at work for the last year and have been pretty impressed with it. There are a few gaps in terms of the styles it provides but that's where Elysium Extra comes in.

# Look and Feel

This SDK takes its own view of what Metro ought to look like. It makes much more use of the accent colour in its controls which have a bold and striking look to them. Where colour is used, it is used in abundance, on the otherwise plain white canvas.

Once again, this SDK supports themes out of the box. It gives you the option of a dark or light background, an accent colour and contrast colour.

![Elysium Screenshot Light Buttons Showcase](./images/Elysium_Screenshot_Light_Buttons.png)

![Elysium Screenshot Dark Buttons Showcase](./images/Elysium_Screenshot_Dark_Buttons.png)

# Custom Controls

## AppBar, CommandButton, DropDownCommandButton and ToggleCommandButton

The standard Windows 8 buttons are all here but composed of three variants. The SDK also provides a Windows 8 style application bar which pops up from the bottom of the screen on right click. Buttons placed in the application but have separate styles and look pretty pleasing. The developer has done a pretty good job of recreating the Windows 8 application bar experience.

## ToggleSwitch

The standard alternative to the CheckBox control is here too.

![Elysium Screenshot Light Selectors And Ranges Showcase](./images/Elysium_Screenshot_Light_SelectorsAndRanges.png)

![Elysium Screenshot Dark Selectors And Ranges Showcase](./images/Elysium_Screenshot_Dark_SelectorsAndRanges.png)

## ProgressBar and ProgressRing

These are the alternatives to the standard WPF ProgressBar control and are quite pleasing to the eye.

# Source Code

The code is available on GitHub and you could download the latest change set but it seems to be broken at the time of writing because the developer is doing some pretty major re-factoring (Use Team Foundation Server shelve-sets to avoid checking in broken code). That's a bit of a shame as the basics of this SDK are pretty solid.

Looking at the discussion boards, there seems to be a fair amount of activity but the developer seems to have gone on holiday as I've been unable to contact him to talk about Elysium Extra which I'll be discussing in my next post (**Update:** The developer is back and says he is continuing development after a brief pause).

# Conclusions

This is a solid SDK but it does lack basic styles for some WPF controls such as the DatePicker and DataGrid, for some this is a deal breaker but Elysium Extra covers these bases and more. Elysium does provide a NuGet package which is great and even an MSI which has full integration with Visual Studio!

![Elysium Screenshot Light Text And Menus Showcase](./images/Elysium_Screenshot_Light_TextAndMenus.png)

![Elysium Screenshot Dark Text And Menus Schowcase](./images/Elysium_Screenshot_Dark_TextAndMenus.png)
