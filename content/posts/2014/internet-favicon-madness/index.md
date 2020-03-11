---
title: "Internet Favicon Madness (Updated)"
description: "Add favicon's to your website to support iOS, Android, Windows 7, Windows 8, Windows Phone and more. Find out where icons are used on each platform and how."
author: "Muhammad Rehan Saeed"
permalink: "/internet-favicon-madness/"
cover_image: "./images/Favicons.png"
date: "2014-11-24"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "Android"
  - "ASP.NET MVC"
  - "ASP.NET Core Boilerplate"
  - "C#"
  - "Favicon"
  - "HTML 5"
  - "iOS"
  - "Meta Tags"
  - "Windows 8.1"
---

- [ASP.NET Core Boilerplate](http://rehansaeed.com/asp-net-mvc-boilerplate/)
- Security
    - [Securing the ASP.NET MVC Web.config (Updated)](http://rehansaeed.com/securing-the-aspnet-mvc-web-config/)
    - [NWebSec ASP.NET MVC Security Through HTTP Headers](http://rehansaeed.com/nwebsec-asp-net-mvc-security-through-http-headers/)
    - [Content Security Policy (CSP) for ASP.NET MVC](http://rehansaeed.com/content-security-policy-for-asp-net-mvc/)
- Search Engine Optimization (SEO)
    - [Canonical URL's for ASP.NET MVC](http://rehansaeed.com/canonical-urls-for-asp-net-mvc/)
    - [Dynamically Generating Robots.txt Using ASP.NET MVC](http://rehansaeed.com/dynamically-generating-robots-txt-using-asp-net-mvc)
- [Internet Favicon Madness (Updated)](http://rehansaeed.com/internet-favicon-madness/)
- [Building RSS/Atom Feeds for ASP.NET MVC](http://rehansaeed.com/building-rssatom-feeds-for-asp-net-mvc/)

These days there is a ridiculous range of devices that can access your website from phone and desktop browsers to phone apps, operating systems and search engine bots. Most of them will require some kind of icon or image to display for your website. Some of them go even further and even allow you to specify splash screens for when your page is loading or an RSS feed URL for the latest updates from your site.

A brain dump of all my knowledge regarding favicon's and many other ASP.NET MVC features can be found in the [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) project on GitHub. Its a professional ASP.NET MVC template for building secure, fast, robust and adaptable web applications or sites. It provides the minimum amount of code required on top of the default MVC template provided by Microsoft.

This blog post tries to be as comprehensive as possible in explaining the absolute madness that is the internet favicon and its related 'bits' for want of a better word. So without further ado, here is a list of files that you need to add to support all the different devices that can access your site:

![Favicon Files](./images/Favicon-Files.png)

The list of all files required to support favicon's and splash screen images on all devices.

Now you can add all these files to the root directory of your site and have a really messy project or you can add the files to a `/content/icons` folder in your project and add the following link and meta tags to the head section of your HTML pages:

```xml
<!-- Icons & Platform Specific Settings - Favicon generator used to generate the icons below http://realfavicongenerator.net -->
<!-- shortcut icon - This file contains the following sizes 16x16, 32x32 and 48x48. -->
<link rel="shortcut icon" href="/content/icons/favicon.ico">
<!-- favicon-96x96.png - For Google TV https://developer.android.com/training/tv/index.html#favicons. -->
<link rel="icon" type="image/png" href="/content/icons/favicon-96x96.png" sizes="96x96">
<!-- favicon-32x32.png - For Safari on Mac OS. -->
<link rel="icon" type="image/png" href="/content/icons/favicon-32x32.png" sizes="32x32">
<!-- favicon-16x16.png - The classic favicon, displayed in the tabs. -->
<link rel="icon" type="image/png" href="/content/icons/favicon-16x16.png" sizes="16x16">

<!-- Android/Chrome -->
<!-- manifest-json - The location of the browser configuration file. It contains locations of icon files, name of the application and default device screen orientation. Note that the name field is mandatory.
    https://developer.chrome.com/multidevice/android/installtohomescreen. -->
<link rel="manifest" href="/content/icons/manifest.json">
<!-- theme-color - The colour of the toolbar in Chrome M39+
    http://updates.html5rocks.com/2014/11/Support-for-theme-color-in-Chrome-39-for-Android -->
<meta name="theme-color" content="#1E1E1E">
<!-- favicon-192x192.png - For Android Chrome M36 to M38 this HTML is used. M39+ uses the manifest.json file. -->
<link rel="icon" type="image/png" href="/content/icons/favicon-192x192.png" sizes="192x192">
<!-- mobile-web-app-capable - Run Android/Chrome version M31 to M38 in standalone mode, hiding the browser chrome. -->
<!-- <meta name="mobile-web-app-capable" content="yes"> -->

<!-- Apple Icons - You can move all these icons to the root of the site and remove these link elements, if you don't mind the clutter.
    https://developer.apple.com/library/safari/documentation/AppleApplications/Reference/SafariHTMLRef/Introduction.html#//apple_ref/doc/uid/30001261-SW1 -->
<!-- apple-touch-icon-57x57.png - Android Stock Browser and non-Retina iPhone and iPod Touch -->
<link rel="apple-touch-icon" sizes="57x57" href="/content/icons/apple-touch-icon-57x57.png">
<!-- apple-touch-icon-114x114.png - iPhone (with 2× display) iOS = 6 -->
<link rel="apple-touch-icon" sizes="114x114" href="/content/icons/apple-touch-icon-114x114.png">
<!-- apple-touch-icon-72x72.png - iPad mini and the first- and second-generation iPad (1× display) on iOS = 6 -->
<link rel="apple-touch-icon" sizes="72x72" href="/content/icons/apple-touch-icon-72x72.png">
<!-- apple-touch-icon-144x144.png - iPad (with 2× display) iOS = 6 -->
<link rel="apple-touch-icon" sizes="144x144" href="/content/icons/apple-touch-icon-144x144.png">
<!-- apple-touch-icon-60x60.png - Same as apple-touch-icon-57x57.png, for non-retina iPhone with iOS7. -->
<link rel="apple-touch-icon" sizes="60x60" href="/content/icons/apple-touch-icon-60x60.png">
<!-- apple-touch-icon-120x120.png - iPhone (with 2× and 3 display) iOS = 7 -->
<link rel="apple-touch-icon" sizes="120x120" href="/content/icons/apple-touch-icon-120x120.png">
<!-- apple-touch-icon-76x76.png - iPad mini and the first- and second-generation iPad (1× display) on iOS = 7 -->
<link rel="apple-touch-icon" sizes="76x76" href="/content/icons/apple-touch-icon-76x76.png">
<!-- apple-touch-icon-152x152.png - iPad 3+ (with 2× display) iOS = 7 -->
<link rel="apple-touch-icon" sizes="152x152" href="/content/icons/apple-touch-icon-152x152.png">
<!-- apple-touch-icon-180x180.png - iPad and iPad mini (with 2× display) iOS = 8 -->
<link rel="apple-touch-icon" sizes="180x180" href="/content/icons/apple-touch-icon-180x180.png">

<!-- apple-mobile-web-app-title - The name of the application if pinned to the IOS start screen. -->
<!-- <meta name="apple-mobile-web-app-title" content=""> -->
<!-- apple-mobile-web-app-capable - Hide the browsers user interface on IOS, when the app is run in 'standalone' mode. Any links to other pages that are clicked whilst your app is in standalone mode will launch the full Safari browser. -->
<!-- <meta name="apple-mobile-web-app-capable" content="yes"> -->
<!-- apple-mobile-web-app-status-bar-style - default/black/black-translucent Styles the IOS status bar. Using black-translucent makes it transparent and overlays it on top of your site, so make sure you have enough margin. -->
<!-- <meta name="apple-mobile-web-app-status-bar-style" content="black"> -->

<!-- Apple Startup Images - These splash screen images are only shown if apple-mobile-web-app-capable is set to true. https://gist.github.com/tfausak/2222823 -->
<!-- apple-touch-startup-image-1536x2008.png - iOS 6 & 7 iPad (retina, portrait) -->
<!-- <link rel="apple-touch-startup-image" href="/content/icons/apple-touch-startup-image-1536x2008.png" media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2)"> -->
<!-- apple-touch-startup-image-1496x2048.png - iOS 6 & 7 iPad (retina, landscape) -->
<!-- <link rel="apple-touch-startup-image" href="/content/icons/apple-touch-startup-image-1496x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 2)"> -->
<!-- apple-touch-startup-image-768x1004.png - iOS 6 iPad (portrait) -->
<!-- <link rel="apple-touch-startup-image" href="/content/icons/apple-touch-startup-image-768x1004.png" media="(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 1)"> -->
<!-- apple-touch-startup-image-748x1024.png - iOS 6 iPad (landscape) -->
<!-- <link rel="apple-touch-startup-image" href="/content/icons/apple-touch-startup-image-748x1024.png" media="(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 1)"> -->
<!-- apple-touch-startup-image-640x1096.png - iOS 6 & 7 iPhone 5 -->
<!-- <link rel="apple-touch-startup-image" href="/content/icons/apple-touch-startup-image-640x1096.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"> -->
<!-- apple-touch-startup-image-640x920.png - iOS 6 & 7 iPhone (retina) -->
<!-- <link rel="apple-touch-startup-image" href="/content/icons/apple-touch-startup-image-640x920.png" media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2)"> -->
<!-- apple-touch-startup-image-320x460.png - iOS 6 iPhone -->
<!-- <link rel="apple-touch-startup-image" href="/content/icons/apple-touch-startup-image-320x460.png" media="(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 1)"> -->

<!-- Windows 7 Taskbar - This depends on your site, so no code here. See http://www.buildmypinnedsite.com/windows7 -->

<!-- Windows 8 IE10 -->
<!-- application-name - The name of the application if pinned to the start screen. -->
<!-- <meta name="application-name" content=""> -->
<!-- msapplication-TileColor - The tile colour which shows around your tile image (msapplication-TileImage). -->
<!-- <meta name="msapplication-TileColor" content="#5cb95c"> -->
<!-- msapplication-TileImage - The tile image. -->
<!-- <meta name="msapplication-TileImage" content="/content/icons/mstile-144x144.png"> -->

<!-- Windows 8.1 IE11 -->
<!-- msapplication-config - The location of the browser configuration file. If you have an RSS feed, go to
    http://www.buildmypinnedsite.com and regenerate the browserconfig.xml file. You will then have a cool live tile! -->
<meta name="msapplication-config" content="/content/icons/browserconfig.xml">
```

Now don't be too scared, there are only 24 lines that you need, the rest is all comments describing what each line is for, which I'll go through it in the rest of this post.

Now, go ahead take another look above. That is 30 files and almost as many lines of code if you decide to have your files in a nice separate folder. Take a moment to let the insanity of this situation settle in. All we are really trying to do is set an icon for our site!

# Performance and Size Trade-Off

This approach does use more bandwidth. Those 24 lines take up around 2.8KB, if you decide to support everything or around 1.4KB if you skip support for Apple splash screens which takes about half the space due to its extremely verbose meta tags.

However, you should be using GZip compression for transferring your HTML pages over the internet (I'll be covering GZip compression in a subsequent post) so when compressed we are talking around 650 Bytes if you include everything or around 465 Bytes if you remove support for Apple splash screens.

At the end of the day it's a trade off and I'll leave making that decision up to you. You can support all of it, none of it or anything in between. 650 Bytes for **every** page can add up to a fair amount of bandwidth, especially if you have a large number of requests coming into your site. If you had say a million requests, which is not unheard of if you consider that this overhead is added to every page, then you are looking at around 0.6GB of bandwidth and that's **before** you add up extra bandwidth usage from the images and Android/Chrome/Windows XML/JSON configuration files.

The `manifest.json` and `browserconfig.xml` file are small files around 1KB but they can also be GZIP compressed and more importantly they can be cached by the browser. A bigger problem is the image files. These files are up to 37KB in size, they cannot be compressed as PNG's are already compressed but they can be downloaded once and then cached. It's difficult to calculate how often these files will be downloaded and how much bandwidth this will use.

Then again, how do we measure the value of users who feel more engaged with your site because they get a more customized and integrated experience when using your site. It's a difficult question and the answer will be different for every site.

# The Favicon.ico File

[Favicon's](http://en.wikipedia.org/wiki/Favicon) were introduced in 1995 by Microsoft with Internet Explorer 5.0. You could add a `favicon.ico` file to the root of your site and it would get displayed next to the address bar.

Favicons use the ancient [.ico](http://en.wikipedia.org/wiki/ICO_%28file_format%29) image format which began life as a part of Windows 1.0! A lot of people don't realize that the `.ico` file can actually contain several images of varying sizes and colour depths. Typically the image sizes can include `16x16`, `32x32`, `48x48`, `64x64`, `128x128` and `256x256`. Windows or your web browser can then choose the appropriate size they need for display. Most favicon's are uncompressed images and although the images are small the file size is not as small as it could be.

# Where Are Favicon's Used

## Desktop Browsers

These days favicon's are no longer displayed in the address bar of your browser (IE being an exception). Miscreants were abusing this feature and using padlock favicon's to trick unsavvy users into thinking the page was secure and had SSL enabled. Most browsers now only show icons on tabs or when a site is favourited. You can see a table of how desktop browsers use Favicon's [here](http://en.wikipedia.org/wiki/Favicon#Use_of_favicon).

![Desktop Browser Favicon's](./images/Desktop-Browser-Favicons.png)

## iOS

iOS devices can pin your site to the home screen and you can provide icons in a variety of sizes to support phone and tablets with differing screen resolutions. All the files shown above start with `apple-touch-icon`. Increasingly websites are being built to look and feel like everyday phone apps. Apple lets you specify three additional meta tags which allows you to customize what happens after your site is pinned to the home screen:

```xml
<!-- apple-mobile-web-app-title - The name of the application if pinned to the IOS start screen. -->
<meta name="apple-mobile-web-app-title" content="Your Site Title">
<!-- apple-mobile-web-app-capable - Hide the browsers user interface on IOS, when the app is run in 'standalone' mode. 
     Any links to other pages that are clicked whilst your app is in standalone mode will launch the full Safari browser. -->
<meta name="apple-mobile-web-app-capable" content="yes">
<!-- apple-mobile-web-app-status-bar-style - default/black/black-translucent Styles the IOS status bar. Using 
     black-translucent makes it transparent and overlays it on top of your site, so make sure you have enough margin. -->
<meta name="apple-mobile-web-app-status-bar-style" content="black">
```

![iOS Web App Capable](./images/iOS-Web-App-Capable.png)]
The left screen shows a normal web browsing experience on iOS and the right shows a web app capable experience.

If you decide to make your site web app capable by using the meta tag above, you can also set a splash screen which gets shown when your site is first launched. Once again, there are several sizes depending on the screen resolution and all the images start with `apple-touch-startup-image`. Find more information about iOS favicon's, startup images and meta tags [here](http://blog.teamtreehouse.com/optimizing-mobile-web-apps-ios).

## Microsoft Windows 7 Taskbar

If your site is pinned to the Windows 7 taskbar then you can customize the jump list items with additional links to pages on your site. There are lots of other additional features (See image below) but these require JavaScript and some additional work. Also, I'm not really sure how often people pin websites to the taskbar (I personally have never done it), so I'm not sure if its worth it. Check out the [Windows 7 Build My Pinned Site](http://www.buildmypinnedsite.com/windows7) page for examples and more information.

![Windows 7 Taskbar Settings](./images/Windows-7-Taskbar.png)

## Microsoft Windows Phone 8 and Windows 8

Windows Phone 8 and Windows 8 takes a very interesting approach. Pinning a site to the start screen of one of these devices gives you a very large tile. You can specify an icon for your tile and also an RSS feed URL. The RSS feed is polled and new updates are shown on your tile regularly (I've implemented this feature on this site, so pin this site to your Windows 8 home screen and give it a try). You can also specify a background colour which is used when showing the RSS feed items. Pretty cool eh!

![Windows 8 Tiles](./images/Windows-8-Favicons.png)

Now if Microsoft had taken Apple's approach it would be cluttering up the head section of your site with a lot of meta data. Microsoft splits off its tile configuration into a separate `browserconfig.xml` file (See example below). This is a much cleaner approach and very much welcomed. You can add this file to the root of your site or if you want to move it elsewhere, add a meta tag pointing to it (Note that this file was introduced in Windows 8.1 and Windows 8 still uses meta tags in the head of the page. Windows 8 is on its way out, so I probably would not support it).

```xml
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="tiny.png"/>
      <square150x150logo src="square.png"/>
      <wide310x150logo src="wide.png"/>
      <square310x310logo src="large.png"/>
      <TileColor>#fff200</TileColor>
    </tile>
    <notification>
      <polling-uri src="http://notifications.buildmypinnedsite.com/?feed=http://rehansaeed.com/feed/&amp;id=1"/>
      <polling-uri2 src="http://notifications.buildmypinnedsite.com/?feed=http://rehansaeed.com/feed/&amp;id=2"/>
      <polling-uri3 src="http://notifications.buildmypinnedsite.com/?feed=http://rehansaeed.com/feed/&amp;id=3"/>
      <polling-uri4 src="http://notifications.buildmypinnedsite.com/?feed=http://rehansaeed.com/feed/&amp;id=4"/>
      <polling-uri5 src="http://notifications.buildmypinnedsite.com/?feed=http://rehansaeed.com/feed/&amp;id=5"/>
      <frequency>30</frequency>
      <cycle>1</cycle>
    </notification>
  </msapplication>
</browserconfig>
```

## Android/Chrome

Android/Chrome recently introduced new favicon's and browser settings. interestingly, their solution looks very similar to Microsoft's approach. Microsoft includes all their settings in a `browserconfig.xml` file which can be included in the root of your site or using a meta tag to refer to it. Android/Chrome has taken a very similar step and introduced a `manifest.json` file which you can also optionally point to in your HTML as shown below.

```xml
<!-- manifest-json - The location of the browser configuration file. It contains locations of icon files, name of the application and default device screen orientation. Note that the name field is mandatory.
    https://developer.chrome.com/multidevice/android/installtohomescreen. -->
<link rel="manifest" href="/content/icons/manifest.json">
```

The `manifest.json` file contains the name of the site, optional page orientation settings and the location of favicon images. Unfortunately, the name of the site is not an optional field but required according to the specification. The rest of the file is dedicated to specifying the location of the various favicon images of varying pixel densities. You can also optionally control the orientation of the site and how it appears on an Android device. One new feature is the ability to set the browser chrome theme colour. This can be done with the `theme-color` meta tag and examples of the results can be seen below:

```xml
<!-- theme-color - The colour of the toolbar in Chrome M39+
    http://updates.html5rocks.com/2014/11/Support-for-theme-color-in-Chrome-39-for-Android -->
<meta name="theme-color" content="#1E1E1E">
```

![Android Theme Colour](./images/Android-Theme-Colour.png)

Older versions of Android (M31 to M38) don't use the `manifest.json` file but are very similar to iOS and even uses some of the iOS icons if they are provided, as iOS icons tend to be a little higher resolution and more widely supported. Android also has the ability to hide the browser chrome to make your site behave like an app. It's meta tag has a different name:

```xml
<!-- favicon-192x192.png - For Android Chrome M36 to M38 this HTML is used. M39+ uses the manifest.json file. -->
<link rel="icon" type="image/png" href="/content/icons/favicon-192x192.png" sizes="192x192">
<!-- mobile-web-app-capable - Run Android/Chrome version M31 to M38 in standalone mode, hiding the browser chrome. -->
<!-- <meta name="mobile-web-app-capable" content="yes"> -->
```

## Other

Favicons are used in a few other places, such as pinning your site to the taskbar in Windows for instance or even on your television.

# How Can I Make This Easier

Even if you decide not to make your site web app capable and support just the basic iOS, Android and Windows icons and settings, your still in for a fair amount of work to create all the right images and get all the meta tags just right.

The [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) project template can help you get started quickly as all of the above files and meta tags are built in from the start, all you need to do is delete the ones you don't want (A lot quicker than starting from scratch).

I also highly recommend using [Real Favicon Generator](http://realfavicongenerator.net) in conjunction with Microsoft's [Windows 8 Build My Pinned Site](http://www.buildmypinnedsite.com) and [Windows 7 Build My Pinned Site](http://www.buildmypinnedsite.com/windows7) pages. These three sites combined can help you get most of the way there and fairly quickly.

The [Real Favicon Generator](http://realfavicongenerator.net) site above will generate a `.ico` file for you but to get a real pixel perfect icon I personally use [Paint.NET](http://www.getpaint.net/) in conjunction with the [Icon plugin](http://forums.getpaint.net/index.php?/topic/927-icon-cursor-and-animated-cursor-format-v37-may-2010/) to edit `.ico` image files.

# What a Mess

So what is the future? Higher screen resolutions and a wider variety of devices of different sizes is now the norm and each one seems to need it's own images. Each manufacturer has added their own meta tags too.

One approach would be to standardize a set of three or four images sizes and then also provide a colour meta tag. The image can then be shown in the center and the colour shown around the image to fill in any gaps. This means that the image does not have to be resized and this approach would also support splash screens and non-rectangular or odd shaped icons. Indeed, this is the approach Microsoft has already taken with their [Windows 8.1 Store App splash screens](http://msdn.microsoft.com/en-gb/library/windows/apps/hh465338.aspx) and it works well in my experience.

An even better and web standards based approach is to use [SVG](http://en.wikipedia.org/wiki/Scalable_Vector_Graphics) favicon's. These are vector images which do not lose image fidelity even when scaled. Unfortunately, this feature is only [currently supported by the Firefox desktop browser](http://caniuse.com/#feat=link-icon-svg). If all browsers implemented this feature we could go back to the days of Internet Explorer 5.0 when we only needed to create a single favicon.ico file. An SVG favicon can be set by adding the following tag:

```xml
<link rel="icon" type="image/svg+xml" href="favicon.svg"/>
```

Lets all hope more browsers support this simple approach but don't hold your breath.
