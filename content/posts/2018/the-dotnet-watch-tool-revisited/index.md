---
title: "The Dotnet Watch Tool Revisited"
description: "The dotnet watch tool is a file watcher for dotnet that restarts the application when changes in the source code are detected. You can use dotnet watch in Visual Studio by using the launchSettings.json configuration file."
author: "Muhammad Rehan Saeed"
permalink: "/the-dotnet-watch-tool-revisited/"
cover_image: "/images/hero/NET-1366x768.png"
date: "2018-04-30"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET Core"
  - ".NET Boxed"
  - "ASP.NET MVC"
  - "dotnet watch"
  - "launchSettings.json"
  - "Visual Studio"
---

I talked about using the [dotnet watch tool](/the-dotnet-watch-tool/) with Visual Studio some time ago. Since then, a lot changed with the Visual Studio tooling and .NET Core 2.0 which broke the use of dotnet watch in Visual Studio, hence the reason for writing this post.

The `dotnet watch` tool is a file watcher for dotnet that restarts the application when changes in the source code are detected. This is super useful when you just want to hack away at code and see the changes instantly when you refresh your browser. It increases productivity and reduces the magical inner-loop which reduces the time taken to write some code and then see it's effects. I also like using this tool because it opens a console window which lets you see all of your logs flashing by.

![Dotnet Watch Run Console](./images/Dotnet-Watch-Run-Console.png)

::: warning
In both cases you have to be careful to start the application by clicking Debug -> Start Without Debugging or hitting the CTRL+F5 keyboard shortcut.
:::

# .NET Core 2.0 vs 2.1

Setting up the 'dotnet watch' tool is as easy as installing the `Microsoft.DotNet.Watcher.Tools` NuGet package if you are using .NET Core 2.0. If you are using .NET Core 2.1 or above, this tool comes pre-installed in the .NET Core SDK.

Now using powershell, you can navigate to your project folder and run the `dotnet watch run` command and your set. But using the command line is a bit lame if you are using Visual Studio, we can do one better.

# launchSettings.json

The `launchSettings.json` file is used by Visual Studio to launch your application and controls what happens when you hit F5. It turns out you can add additional launch settings here to launch the application using the `dotnet watch` tool. You can do so by adding a new launch configuration as I've done at the bottom of this file:

```json
{
  "iisSettings": {
    "windowsAuthentication": false,
    "anonymousAuthentication": true,
    "iisExpress": {
      "applicationUrl": "http://localhost:5000/",
      "sslPort": 44300
    }
  },
  "profiles": {
    "IIS Express": {
      "commandName": "IISExpress",
      "launchBrowser": true,
      "launchUrl": "http://localhost:5000/",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development",
        "ASPNETCORE_HTTPS_PORT": "44300"
      }
    },
    "dotnet run": {
      "commandName": "Project",
      "launchBrowser": true,
      "launchUrl": "http://localhost:5000/",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development",
        "ASPNETCORE_HTTPS_PORT": "44300"
      }
    },
    // dotnet watch run must be run without the Visual Studio debugger using CTRL+F5.
    "dotnet watch run": {
      "commandName": "Executable",
      "executablePath": "dotnet",
      "workingDirectory": "$(ProjectDir)",
      "commandLineArgs": "watch run",
      "launchBrowser": true,
      "launchUrl": "http://localhost:5000/",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development",
        "ASPNETCORE_HTTPS_PORT": "44300"
      }
    }
  }
}
```

Notice that I renamed the second launch profile (which already exists in the default template) to `dotnet run` because that's actually the command it's running and makes more sense.

The `dotnet watch` launch profile is running the `dotnet watch run` command as an executable and using the current working directory of the project. Now we can see the new launch profile in the Visual Studio toolbar like so:

![Dotnet Watch in the Visual Studio Toolbar](./images/Dotnet-Watch.png)

# .NET Boxed Templates

I've updated the [.NET Boxed](https://github.com/Dotnet-Boxed/Templates) family of project templates with this feature built in. Happy coding!
