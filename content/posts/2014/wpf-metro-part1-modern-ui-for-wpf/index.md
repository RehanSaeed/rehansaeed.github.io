---
title: "WPF Metro Part 1 - Modern UI for WPF"
description: "Modern UI for WPF is an excellent Windows Presentation Foundation (WPF) SDK providing Metro styles for built in WPF controls and several custom controls."
author: "Muhammad Rehan Saeed"
permalink: "/wpf-metro-part1-modern-ui-for-wpf/"
# cover_image: "https://www.youtube.com/watch?v=Bk7mlEQI2rk"
date: "2014-02-19"
published: true
categories:
  - "Windows Presentation Foundation (WPF)"
tags:
  - ".NET"
  - "C#"
  - "Metro"
  - "Modern"
  - "SDK"
  - "UI"
  - "User Interface"
  - "Windows Presentation Foundation"
  - "WPF"
  - "XAML"
---

- [WPF Metro Part 1 - Modern UI for WPF](/wpf-metro-part1-modern-ui-for-wpf/)
- [WPF Metro Part 2 - MahApps Metro](/wpf-metro-part2-mahapps-metro/)
- [WPF Metro Part 3 - Elysium](/wpf-metro-part3-elysium/)
- [WPF Metro Part 4 - Elysium Extra](/wpf-metro-part4-elysium-extra/)

In these series of posts I'm going to do a quick review of a few different open source WPF Metro (Or Modern if you prefer) style SDK's. Each of them provides styles and new controls to build your WPF application from scratch. Here are the home pages for the open source projects in question where you can download the source code and the binaries to play with them yourself:

- [Modern UI for WPF](https://mui.codeplex.com/)
- [MahApps Metro](https://github.com/MahApps)
- [Elysium](https://elysium.codeplex.com/)
- [Elysium Extra](https://elysiumextra.codeplex.com/)

# Modern UI for WPF

In this first post I will be discussing [Modern UI for WPF](https://mui.codeplex.com/). This is a very lightweight framework which has a complete set of styles for the built in WPF controls.

# Look and Feel

The look of the application seems to borrow quite heavily from Microsoft's Zune application, which is Microsoft's equivalent of Apple's iTunes. Zune was used by Microsoft as an early test bed for their Metro style. Microsoft then went on from there to build Windows 8. This is Zune below:

![Microsoft Zune Software](./images/Zune.png)

The Window style is quite stunning, mostly achieved by providing some very nice soft backgrounds to go with the option of white or black themes. The theme is fairly flexible, allowing a selection of 'Accent' colours and even selection of small and large font sizes. One cool feature I discovered is that changing the them does not simple change the colours but the Developer has used a colour animation to transition from one colour to another.

![Modern UI for WPF Heart Background](./images/Modern-UI-for-WPF-2.png)

![Modern UI for WPF Themes](./images/Modern-UI-for-WPF-1.png)

The controls themselves are more toned down. Employing simple grey lines and a very minimalist design. Most of the controls are slightly on the small side compared to Windows 8 but having played with Zune I can tell you that the developer has recreated everything pretty accurately.

![Modern UI for WPF Input Controls](./images/Modern-UI-for-WPF-4.png)

All the built in WPF controls seem to have been styled and a type ramp is even included, giving a simple way to show text in different guises. Validation of input is supported via the TextBox control. It would have been nice for other controls to have been supported too but it is very nicely done.

# Custom Controls

## ModernMenu

The main control of interest is the tab control called ModernMenu, this provides a very interesting multi-level tabbed experience. It allows you to split the tab contents into seperate user controls using the URI to the XAML page a bit like the Silverlight experience. Navigation is always a problem that needs to be solved in a WPF application and this is one very clean method of doing it.

![Modern UI for WPF ModernMenu](./images/Modern-UI-for-WPF-3.png)

## ModernButton

A Windows 8 style circular app-bar button. Comes in two sizes.

![Modern UI for WPF ModernButton](./images/Modern-UI-for-WPF-5.png)

## ModernWindow, ModernDialog and MessageBox

The developer has inherited from the Window class to create three very useful window types.

![Modern UI for WPF ModernDialog](./images/Modern-UI-for-WPF-6.png)

![Modern UI for WPF MessageBox](./images/Modern-UI-for-WPF-7.png)

## ModernProgressRing

This is very easily the best progress indicator I have seen. It has several modes, allowing you to select the method of showing progress. Simply mesmerizing.

![Modern UI for WPF ModernProgressRing](./images/Modern-UI-for-WPF-8.png)

## BBCodeBlock

This is a nice little control allowing you to use [BB code](http://en.wikipedia.org/wiki/BB_code) to write some text.

![Modern UI for WPF BBCodeBlock](./images/Modern-UI-for-WPF-9.png)

# Source Code

The source code seems pretty lightweight and nicely structured, with each controls style having it's own XAML file. There are only two DLL's which need to be deployed, they even provide a NuGet package which is great. Looking at the checking history, the single developer (The creator of XAML Spy no less) seems fairly active with the last check-in performed on 21st January 2014, so the project is still very much active. Looking at the discussion forums he seems to also be very helpful.

# Conclusions

Overall I'm very impressed with this SDK, it's a labour of love from a single developer. It has a very high attention to detail and covers most bases for most developers, providing a full set of WPF styles.

If the developer is reading, I would suggest adding a tab in his sample showing the colours and brushes available to the developers and expanding his validation to other input controls.

This is a great project and it would be a pleasure to use any application developed using this SDK.
