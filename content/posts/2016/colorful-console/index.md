---
title: "Colorful.Console"
description: "Colorful.Console is a C# library that wraps around the System.Console class, making your console apps more colourful. Write ASCII art using Figlet fonts."
author: "Muhammad Rehan Saeed"
permalink: "/colorful-console/"
heroImage: "/images/hero/Colorful.Console-1366x768.png"
date: "2016-02-14"
dateModified: null
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASCII"
  - "C#"
  - "Colorful.Console"
  - "Console"
  - "DNVM"
  - "Figlet Font"
  - "GitHub"
  - "NuGet"
---

I needed to write a console application a while back and was investigating the best way to do this using the available NuGet packages. I'd seen the DNVM command line tool that Microsoft built for ASP.NET Core and really liked it and wanted something similar.

![DNVM](./images/DNVM.png)

I really like the old school ASCII art title and the use of colour. The .NET Framework does contain an enum called ConsoleColor which contains a very limited set of hard coded colours you can use but it has some major omissions like the colour orange for example.

In my hunt for a C# ASCII art generator, I discovered [patorjk.com](http://patorjk.com) which is great for generating text using various [Figlet](http://www.figlet.org/) fonts. Figlet fonts are basically .flf text files which contain instructions on how each letter in the ASCII character table can be printed out. It turns out these fonts are pretty ancient and there are libraries in every language writing out text using Figlet fonts.

# Colorful.Console

I was just about to give up and write my own open source library when I discovered [Colorful.Console](http://colorfulconsole.com/), available on [GitHub](https://github.com/tomakita/Colorful.Console).  Using this library you can very easily write console apps which look like this:

![Colorful.Console Example 1](./images/Colorful.Console.Example-1.png)

Or this:

![Colorful.Console Example 2](./images/Colorful.Console.Example-2.png)

The only thing missing was a method to write ASCII text using Figlet fonts, so I contributed some code to the project to get this done. The output, combined with the fade that Colorful.Console is capable of created a pretty cool effect. Unbelievably this is a couple of lines of code to write!

![Colorful.Console Example 3](./images/Colorful.Console-Example-3.png)

The title image of this post is also generated using Colorful.Console but was a bit more complicated as it transitions through several colours. By default Colorful.Console includes a single Figlet font but there are dozens of others available which you can download and use yourself.  They aren't all included by default because they would bloat the library quite a bit.

# Command Line Parsers

Now the only thing missing in my quest was a command line parser which could let me easily create commands, switches and flags so users could use my command line tool. The best tool I found was [Command Line Parser](https://github.com/gsscoder/commandline) available on GitHub. It's a pretty powerful and fully features library that makes writing a command line interface very easy. Unfortunately, its output is pretty ugly and it does not let you customize the 'look and feel' of what is output to the console.

At some point, I'd like to make another contribution to Colorful.Console, so that it offers command line parsing too but take inspiration from several command line parsing libraries to make something that's fully customizable and of course very colourful.

Command line tools have been around for decades, it's a wonder that a NuGet package that does all of these things does not exist yet.
