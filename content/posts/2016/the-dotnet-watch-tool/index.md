---
title: "The Dotnet Watch Tool"
description: "The dotnet watch tool is a file watcher for dotnet that restarts the application when changes in the source code are detected."
author: "Muhammad Rehan Saeed"
permalink: "/the-dotnet-watch-tool/"
cover_image: "/images/hero/NET-1366x768.png"
date: "2016-09-10"
dateModified: null
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET Core"
  - "ASP.NET MVC"
  - ".NET Boxed"
  - "dotnet watch"
  - "launchSettings.json"
  - "project.json"
  - "Visual Studio"
---

The `dotnet watch` tool is a file watcher for dotnet that restarts the application when changes in the source code are detected. If you are using IIS Express then, it actually does this restart for you already. The `dotnet watch` tool is only really useful if you like to run your app in the console. I personally like to do this over using IIS Express because I can see all my logs flashing by in the console like the movies which is occasionally useful if you get an exception.

![Dotnet Watch Run Console](./images/Dotnet-Watch-Run-Console.png)

::: warning
In both cases you have to be careful to start the application by clicking `Debug -> Start Without Debugging` or hitting the `CTRL+F5` keyboard shortcut.
:::

# project.json

Setting up the `dotnet watch` tool is as easy as installing the `Microsoft.DotNet.Watcher.Tools` NuGet package into the tools section of your `project.json` file like so (You may need to manually restore packages as there is a bug in the tooling which doesn't restore packages if you only change the `tools` section):

```json
{
  //...

  "tools": {
    "Microsoft.DotNet.Watcher.Tools": "1.0.0-preview2-final"
    //...
  },

  //...
}
```

Now using powershell, you can navigate to your project folder and run the `dotnet watch run` command and your set. But using the command line is a bit lame if you are using Visual Studio, we can do one better.

# launchSettings.json

The `launchSettings.json` file is used by Visual Studio to launch your application and controls what happens when you hit `F5`. It turns out you can add additional launch settings here to launch the application using the `dotnet watch` tool. You can do so by adding a new launch configuration as I've done at the bottom of this file:

```json
{
  "iisSettings": {
    "windowsAuthentication": false,
    "anonymousAuthentication": true,
    "iisExpress": {
      "applicationUrl": "http://localhost:8080/",
      "sslPort": 44300
    }
  },
  "profiles": {
    // Run the app using IIS Express. Use CTRL+F5 or Debug -> Start Without Debugging to edit code and refresh the browser 
    // to see your changes while the app is running.
    "IIS Express": {
      "commandName": "IISExpress",
      "launchBrowser": true,
      "launchUrl": "https://localhost:44300/",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
    // Run the app in console mode using 'dotnet run'.
    "dotnet run": {
      "commandName": "Project",
      "commandLineArgs": "--server.urls http://*:8080",
      "launchBrowser": true,
      "launchUrl": "http://localhost:8080/",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
    // Use CTRL+F5 or Debug -> Start Without Debugging to use this launch profile. Launches the app using 'dotnet watch', 
    // which allows you to edit code and refresh the browser to see your changes while the app is running.
    "dotnet watch": {
      "executablePath": "C:\\Program Files\\dotnet\\dotnet.exe",
      "commandLineArgs": "watch run --server.urls http://*:8080",
      "launchBrowser": true,
      "launchUrl": "http://localhost:8080/",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

Notice that I renamed the second launch profile (which already exists in the default template) to `dotnet run` because that's actually the command it's running and makes more sense.

The `dotnet watch` launch profile is running `dotnet watch run` but it's also passing in the `server.urls` argument which lets us override the port number. Now we can see the new launch profile in the Visual Studio toolbar like so:

![Dotnet Watch in the Visual Studio Toolbar](./images/Dotnet-Watch.png)

# .NET Boxed

If you read my blog posts, you'll be seeing a trend by now. I built the above feature into the [.NET Boxed](https://github.com/Dotnet-Boxed/Templates) project templates by default so you can create a new project with this feature built-in, right out of the box. Happy coding!
