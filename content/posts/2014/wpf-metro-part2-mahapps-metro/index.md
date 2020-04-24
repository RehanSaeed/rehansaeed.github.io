---
title: "WPF Metro Part 2 - MahApps Metro"
description: "MahApps Metro is an excellent Windows Presentation Foundation (WPF) SDK providing Metro styles for built in WPF controls and several custom controls."
author: "Muhammad Rehan Saeed"
permalink: "/wpf-metro-part2-mahapps-metro/"
heroImage: "/images/hero/MahApps-Metro-1366x768.png"
date: "2014-03-02"
dateModified: null
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

https://www.youtube.com/watch?v=FLmCkKfIp84

In these series of posts I'm going to do a quick review of a few different open source WPF Metro (Or Modern if you prefer) style SDK's. Each of them provides styles and new controls to build your WPF application from scratch. Here are the home pages for the open source projects in question where you can download the source code and the binaries to play with them yourself:

- [Modern UI for WPF](https://mui.codeplex.com/)
- [MahApps Metro](https://github.com/MahApps)
- [Elysium](https://elysium.codeplex.com/)
- [Elysium Extra](https://elysiumextra.codeplex.com/)

# MahApps Metro

This is the second post in the series, I take a look at MahApps Metro. Again, this SDK provides a complete set of WPF styles and several custom controls, mostly inspired by the new Windows 8 WinRT applications.

# Look and Feel

This SDK borrows heavily from the Windows 8 Metro design language. It provides fairly large controls (For desktop applications, Windows 8 seems to have larger buttons to be touch friendly) with fairly thick borders, which gives each control a more imposing look. There are lots of brushes used by this SDK and the developer has provided a nice colour swatch.

![MahApps Metro screenshot of the available brushes](./images/MahApps-Metro-8.png)

The Window itself positively glows as the developer has spent a **lot** of time customizing the window drop shadow. The title bar of the window also stands out as it is highlighted in the applications accent colour. Theme support is built in, with light or dark combined with an accent colour as shown below.

![MahApps Metro screenshot of the button controls](./images/MahApps-Metro-1.png)

![MahApps Metro screenshot of the changed theme](./images/MahApps-Metro-13.png)

# Custom Controls

## ToggleSwitch

(See Above) Similar to the ToggleSwitch in Windows 8, this control provides an optional replacement for the standard CheckBox control. Every metro SDK seems to include this control.

## CircleButton

(See Above) Again this control borrows from the Windows 8 application bar buttons. A staple of all metro SDK's it seems.

## NumericUpDown

This is a great control that is sorely needed in most WPF applications. Internally it handles numbers of type Double but I suppose you could use a converter to work with Integer and other numeric types.

## Various TextBox Controls

There is a great selection of text box controls. They all seem to have the watermark capability (Again, a simple addition sorely missed in WPF). There is also the option of text boxes with buttons.

![MahApps Metro screenshot of the input controls](./images/MahApps-Metro-2.png)

## ProgressRing

A simple circular progress indicator control. I can stare at these things for hours. Very mesmerizing.

## Range Slider

The range slider is another great addition. It looks very much like the Slider control with an additional thumb button.

![MahApps Metro screenshot of the progress and slider controls](./images/MahApps-Metro-5.png)

## Various MessageDialog's and MessageBox's

This is a truly great message box. Instead of copying and restyling the standard Windows MessageBox, it has been totally reshaped and re-imagined ala Windows 8 to cover the entire parent Window. Not only that but you can place your own custom content in there. There are a few different options to choose from, the version below shows a text box.

![MahApps Metro screenshot of the message box](./images/MahApps-Metro-12.png)

## Flyout

This Windows 8 style fly-out control does what it says on the tin, it flies in and out of the side of the Window. A nice feature is that it covers the title bar of the window but the caption buttons are still overlayed above the fly-out control.

![MahApps Metro screenshot of the fly-out control](./images/MahApps-Metro-10.png)

## FlipView

This control also exists in Windows 8, although it works slightly differently. It allows you to view several items one at a time and provides next and previous buttons to cycle between them.

![MahApps Metro screenshot of the custom controls](./images/MahApps-Metro-9.png)

# Source Code

I downloaded the source code hosted on GitHub and took it for a whirl. All the XAML is pretty well layed out and there is a fair amount of code in the project but that's expected as there are lots of custom controls to play with. There is only a single dependency on System.Windows.Interactivity, so you only need to add references to two DLL's to your projects.

Looking at the discussion boards, there seems to be a fair amount of activity with the developers answering questions and even responding to feedback which is great to see. The last check-in was just four days ago at the time of writing so this project is still very much active. I can see this project getting better and better in the future.

# Conclusions

Once again I'm very impressed with this SDK, it provides styles for all the standard WPF controls and takes a pretty good stab at bringing a lot of Windows 8 Metro controls to the desktop. It does all this while looking and feeling great. They even provide a NuGet package which is great.

![MahApps Metro screenshot of the calendar controls](./images/MahApps-Metro-3.png)

![MahApps Metro screenshot of the DataGrid control](./images/MahApps-Metro-7.png)

![MahApps Metro screenshot of the DataGrid control](./images/MahApps-Metro-6.png)
