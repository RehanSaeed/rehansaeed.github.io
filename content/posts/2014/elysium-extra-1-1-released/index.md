---
title: "Elysium Extra 1.1 Released"
description: "Elysium Extra Version 1.1 is a Windows Presentation Foundation (WPF) SDK providing Metro styles for built in WPF controls and some custom controls."
author: "Muhammad Rehan Saeed"
permalink: "/elysium-extra-1-1-released/"
cover_image: "https://www.youtube.com/watch?v=PGM_uBy99GA"
date: "2014-11-05"
published: true
categories:
  - "Windows Presentation Foundation (WPF)"
tags:
  - ".NET"
  - "C#"
  - "Elysium"
  - "Elysium Extra"
  - "Metro"
  - "Modern"
  - "UI"
  - "User Interface"
  - "Windows Presentation Foundation"
  - "WPF"
---

Version 1.1.4 of Elysium Extra has just been released! If you've never heard of it, Elysium Extra is a Windows Presentation Foundation (WPF) SDK which provides a wide variety of controls and styles. Here are the relevant links to get started with the project:

- [Review](http://rehansaeed.com/wpf-metro-part4-elysium-extra/) - A comprehensive review of the controls and styles available.
- [GitHub](https://github.com/RehanSaeed/Elysium-Extra) - The home of the Elysium Extra project. Hosted on GitHub. Submit issues, ask questions and view source code.
- [Getting Started](https://github.com/RehanSaeed/Elysium-Extra) - A quick start guide to using Elysium Extra in your WPF project.
- [NuGet](https://www.nuget.org/packages/Elysium.Extra) - The Elysium Extra NuGet package link.

![Elysium Extra NuGet](./images/Elysium-Extra-NuGet.png)

At the time of writing the NuGet package has been downloaded **900** times which is pretty exciting given that its been live for only a few months and the project had no theme support in its early life.

# The Future of WPF

WPF has not been getting a lot of love recently. You only have to trek the internet to see all the old WPF projects which have died or gone into hibernation with little or no new updates. I've also seen a lot of 'troll like' comments in Microsoft comment boards asking why no more updates for WPF have been forthcoming.

My personal opinion is that WPF is a very mature product and does not need as many new 'features'. Even still, there have been [minor updates](http://msdn.microsoft.com/en-us/library/bb613588%28v=vs.110%29.aspx) by Microsoft fairly recently as part of .NET 4.5. Let us not forget that Visual Studio is written in WPF and the technology is being maintained. There is a lot of noise being made about upstart XAML technologies like Windows Phone and Windows Store apps (I've written a few myself and they're great too) so sometimes it's easy to overlook WPF.

# What's New

## Theming Support

The latest version of Elysium Extra adds full theming support. There is now a Dark and Light theme (A bit like Windows Store Apps). You can even change the Accent and Contrast colours dynamically on the fly. I've taken a screenshot of the sample application in the Dark them with a nice red accent colour:

![Elysium Extra Dark Theme](./images/Elysium-Extra-Dark-Theme.png)

So how do you change the theme? Well you can do it in XAML by changing your App.xaml file like so:

```xml
<extra:ElysiumApplication x:Class="[YOUR NAMESPACE GOES HERE].App"
                          xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                          xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
                          xmlns:extra="http://schemas.extra.com/ui"
                          AccentColor="Red"
                          ContrastColor="LightBlue"
                          SemitransparentContrastColor="LightCoral"
                          Theme="Dark"
                          StartupUri="MainWindow.xaml"/>
```

In the above sample code, I'm setting the theme to dark and changing the three theme related colours. This is all totally optional of course. You can even change the theme in code behind instead like so:

```cs
public partial class App
{
    public App()
    {
        this.Theme = Theme.Dark;
        this.AccentColor = Colors.Red;
        this.ContrastColor = Colors.LightBlue;
        this.SemitransparentContrastColor = Colors.LightCoral;
    }
}
```

One final feature that I think is very cool is that individual controls can now have a different theme from the rest of the application. You can take a look at the example below where there are two text boxes but one of them has the theme explicitly set to Dark.

![Dark Theme For Individual Controls](./images/Dark-Theme-For-Individual-Controls.png)

```xml
<extra:Window x:Class="WpfApplication1.MainWindow"
              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
              xmlns:extra="http://schemas.extra.com/ui"
              Height="100" 
              Title="Main Window" 
              Width="200">
    <StackPanel>
        <TextBox Margin="5"
                 Text="Hello World"/>
        <TextBox extra:ThemeManager.Theme="Dark"
                 Margin="5"
                 Text="Hello World"/>
    </StackPanel>
</extra:Window>
```

# Performance

In the previous version of Elysium Extra, we were making judicious use of `ResourceDictionary` merging to allow us to split up our XAML files, so that each control has it's own separate XAML file. This led to a large amount of duplication of objects in memory because the contents of various `ResourceDictionary`'s were being instantiated multiple times.

There are a few different approaches to this WPF problem. One that most library writers take (including Microsoft) is to only have a single massive XAML file containing all styles and templates. I hope you like scrolling and never being able to find anything because this is very difficult to maintain. Another approach that the original Elysium project took was to split your xaml  files but then use `.tt` template files to generate a single `ResourceDictionary` which I thought was an elegant approach.

Elysium Extra has taken a different route. There is a new `SharedResourceDictionary` type which only instantiates its contents once. You can use this type yourself too in the same way you use `ResourceDictionary`. It's very useful if you are merging a dictionaries from more than one location. Here is an example take from Elysium Extra itself where we are merging two resource dictionaries:

```xml
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    <ResourceDictionary.MergedDictionaries>
        <controls:SharedResourceDictionary Source="/Framework.UI;component/Themes/WPF/Base/Converter.xaml"/>
        <controls:SharedResourceDictionary Source="/Framework.UI;component/Themes/WPF/Base/Brush.xaml"/>
    </ResourceDictionary.MergedDictionaries>
    
    <!-- Your Code Here -->
    
</ResourceDictionary>
```

# Whats Next

![We Need You](./images/We-Need-You.jpg)

So far, there are two contributing developers working on Elysium Extra (Myself and zsKengren who has contributed new controls which are still to be added to the library) and 22 people following the project [according to GitHub](https://github.com/RehanSaeed/Elysium-Extra). That is not nearly enough and I would like to see more community activity.

Elysium Extra is a totally open source project. You can [look at the source code](https://github.com/RehanSaeed/Elysium-Extra) and even use bits of it in your own projects freely. I occasionally get people contacting me telling me that they want to use the project or even how it has really helped them. That's great feedback and long may it continue!
