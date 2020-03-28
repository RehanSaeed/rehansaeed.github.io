---
title: "Portable Class Library (PCL) version of NotificationsExtensions NuGet package"
description: "NotificationsExtensions.Portable is a Portable Class Library (PCL) used to Create Windows 8.1 or Windows Phone 8.1 Tile, Toast and Badge Notification XML."
author: "Muhammad Rehan Saeed"
permalink: "/portable-class-library-version-of-notificationsextensions-nuget-package/"
cover_image: "./images/NuGet.png"
date: "2014-05-06"
published: true
categories:
  - "NuGet"
  - "Portable Class Library (PCL)"
  - "Windows Phone"
  - "Windows Store"
tags:
  - ".NET"
  - "C#"
  - "NotificationsExtensions"
  - "NuGet"
  - "Portable Class Library (PCL)"
  - "Windows 8.1"
  - "Windows Phone"
  - "Windows Store"
  - "WinRT"
---

I've recently got into creating NuGet packages, when I had to create one for [Elysium Extra](rehansaeed.com/wpf-metro-part4-elysium-extra). I discovered it was [really easy](http://docs.nuget.org/docs/creating-packages/using-a-gui-to-build-packages) to do too. I've just finished creating another one called NotificationsExtensions.Portable and I did in in 5 minutes!

# About

NotificationsExtensions.Portable is a [Portable Class Library (PCL)](http://msdn.microsoft.com/en-us/library/gg597391%28v=vs.110%29.aspx) version of other NotificationsExtensions NuGet Packages. It's used to Create Windows 8.1 or Windows Phone 8.1 Tile, Toast and Badge Notification XML. This package is intended for use, instead of or as well as the following NuGet packages:

- [NotificationsExtensions.WinRT](https://www.nuget.org/packages/NotificationsExtensions.WinRT)
- [NotificationsExtensions.UniversalApps](https://www.nuget.org/packages/NotificationsExtensions.UniversalApps)

# Tile, Toast and Badge Templates

This project helps to create XML representing Tile, Toast and Badge notifications on the Windows 8.1 and Windows Phone 8.1 platforms. You can take a look at the [template catalogue](http://msdn.microsoft.com/en-us/library/windows/apps/Hh761491.aspx) to see the types of templates available on these platforms.

![Wide Tile Template](./images/Tiles.png)

# Why is this Useful?

It's useful when trying to send notifications from the server side using Azure Mobile Services .NET Backend or some other .NET based push notification. When you want to create notification XML in a standard .NET project and not a WinRT project. I personally use it for my [London Travel Live](http://apps.microsoft.com/windows/en-gb/app/london-travel-live/2916d32f-2ca3-4325-adc0-c62b44306fae) and [Currency Converter Pro](http://apps.microsoft.com/windows/en-gb/app/currency-converter-pro/32863ebf-c907-4806-a2dd-864fb4b573da) apps.

# NuGet

NotificationsExtensions.Portable is available on NuGet. Simply follow the instructions below:

1. Click Tools Menu Item in Visual Studio
2. Click NuGet Package Manager
3. Click Package Manager Console
4. Select Your Project in the Package Manager Console
5. Execute the following command to install NotificationsExtensions.Portable: **PM> Install-Package NotificationsExtensions.Portable -Version 1.0.0**

# Attribution and Changes Made

All praise goes to the above two projects and the Microsoft developers who built them. The only changes I made to the code was to switch from XmlDocument to XDocument, remove a few WinRT specific references and stick it into a Portable Class Library (PCL).
