---
title: "ASP.NET Core Fluent Interface Extensions"
description: "Using the fluent interface style in with ASP.NET Core Fluent Interface Extension methods. Building on top of the work done by Khalid Abuhakmeh."
author: "Muhammad Rehan Saeed"
permalink: "/asp-net-core-fluent-interface-extensions/"
cover_image: "/images/hero/Fluent-Interface-All-The-Things-1366x768.png"
date: "2016-06-26"
published: true
categories:
  - "ASP.NET"
tags:
  - "ASP.NET Core"
  - ".NET Boxed"
---

Last week [Khalid Abuhakmeh](http://khalidabuhakmeh.com) wrote a very interesting blog post called [Middleware Builder for ASP.NET Core](http://www.khalidabuhakmeh.com/middlewarebuilder-for-asp-net-core-1-0-rc2#disqus_thread) which I highly recommend you read. In it, he attempts to write some extension methods to help with writing the Configure method in your ASP.NET Core Startup class with a [fluent interface](https://en.wikipedia.org/wiki/Fluent_interface). I've taken his blog post to heart and gone on a mission to 'fluent all the things' in ASP.NET Core.

# IApplicationBuilder and ILoggerFactory

This is an example of what your current Configure method might look like in a typical ASP.NET Core `Startup` class:

```cs
public void Configure(
    IApplicationBuilder application, 
    IHostingEnvironment environment, 
    ILoggerFactory loggerFactory)
{
    if (environment.IsDevelopment())
    {
        // Do stuff on your local machine.
        loggerFactory
            .AddConsole(...)
            .AddDebug();
        application.UseDeveloperExceptionPage();
    }
    else
    {
        // Do stuff on when running in your production environment.
        loggerFactory.AddSerilog(...);
        application.UseStatusCodePagesWithReExecute("/error/{0}/");
    }

    if (environment.IsStaging())
    {
        // Do stuff in the staging environment.
        application.UseStagingSpecificMiddleware(); 
    }

    application
        .UseStaticFiles()
        .UseMvc();
}
```

And this is the same code using the shorter, and prettier fluent interface style:

```cs
public void Configure(
    IApplicationBuilder application, 
    IHostingEnvironment environment, 
    ILoggerFactory loggerFactory)
{
    loggerfactory
        .AddIfElse(
            hostingEnvironment.IsDevelopment(),
            x => x.AddConsole(...).AddDebug(),
            x => x.AddSerilog(...));

    application
        .UseIfElse(
            environment.IsDevelopment(),
            x => x.UseDeveloperExceptionPage(),
            x => x.UseStatusCodePagesWithReExecute("/error/{0}/"))
        .UseIf(
            environment.IsStaging(),
            x => x.UseStagingSpecificMiddleware())
        .UseStaticFiles()
        .UseMvc();
}
```

In the above code, you can see that I've added `UseIf` and `UseIfElse` extension methods to the `IApplicationBuilder`  which lets us use the fluent interface. What you'll also notice is that `ILoggerFactory` also has `AddIf` and `AddIfElse` extension methods.

# IConfigurationBuilder

I didn't just stop there, I added similar `AddIf` and `AddIfElse` extension methods for `IConfigurationBuilder`:

```cs
public Startup(IHostingEnvironment hostingEnvironment)
{
    this.hostingEnvironment = hostingEnvironment;
    var configurationBuilder = new ConfigurationBuilder()
        .SetBasePath(hostingEnvironment.ContentRootPath)
        .AddJsonFile("config.json")
        .AddJsonFile($"config.{hostingEnvironment.EnvironmentName}.json", optional: true);

        if (hostingEnvironment.IsDevelopment())
        {
            configurationBuilder.AddUserSecrets();
        }

        this.configuration = configurationBuilder
            .AddEnvironmentVariables()
            .AddApplicationInsightsSettings(developerMode: !hostingEnvironment.IsProduction())
            .Build();
}

public Startup(IHostingEnvironment hostingEnvironment)
{
    this.hostingEnvironment = hostingEnvironment;
    this.configuration = new ConfigurationBuilder()
        .SetBasePath(hostingEnvironment.ContentRootPath)
        .AddJsonFile("config.json")
        .AddJsonFile($"config.{hostingEnvironment.EnvironmentName}.json", optional: true)
        .AddIf(
            hostingEnvironment.IsDevelopment(),
            x => x.AddUserSecrets())
        .AddEnvironmentVariables()
        .AddApplicationInsightsSettings(developerMode: !hostingEnvironment.IsProduction())
        .Build();
}
```

# IServiceCollection

As if that wasn't enough I also did the same with `IServiceCollection` with the same `AddIf` and `AddIfElse` extension methods. In my experience, these would be used less often but I've added them for completeness.

# Fluent me up!

You can get these extension methods and much more by installing the [Boxed.AspNetCore](https://www.nuget.org/packages/Boxed.AspNetCore) NuGet package or create a project using the [.NET Boxed](https://github.com/Dotnet-Boxed/Templates) project templates. Finally, if you are so inclined, you can also take a look at the code for these extension methods in the [.NET Boxed Framework](https://github.com/Dotnet-Boxed/Framework) project.
