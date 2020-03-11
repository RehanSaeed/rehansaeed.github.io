---
title: "ASP.NET Core Lazy Command Pattern"
description: "Move your ASP.NET Core MVC action method logic into lazily loaded commands using the command pattern, to reduce Controller complexity."
author: "Muhammad Rehan Saeed"
permalink: "/asp-net-core-lazy-command-pattern/"
cover_image: "./images/ASP.NET-Core-Lazy-Command-Pattern.png"
date: "2017-04-08"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - ".NET Core"
  - "ASP.NET Core"
  - "ASP.NET MVC"
  - ".NET Boxed"
  - ".NET Boxed API"
  - "C#"
  - "Command Pattern"
  - "Lazy"
---

::: tip TLDR
Move your ASP.NET Core MVC action method logic into lazily loaded commands using the command pattern.
:::

When writing your Controllers in ASP.NET Core, you can end up with a very long class if you're not careful. You may have written several action methods with a few lines of code in each, you may be injecting a few services into your controller and you may have commented your action methods to support Swagger. The point is it's very easy to do, here is an example:

```cs
[Route("[controller]")]
public class RocketController : Controller
{
    private readonly IPlanetRepository planetRepository;
    private readonly IRocketRepository rocketRepository;

    public RocketController(
        IPlanetRepository planetRepository,
        IRocketRepository rocketRepository)
    {
        this.planetRepository = planetRepository;
        this.rocketRepository = rocketRepository;
    }
    
    [HttpGet("{rocketId}")]
    public async Task<IActionResult> GetRocket(int rocketId)
    {
        var rocket = await this.rocketRepository.GetRocket(rocketId);
        if (rocket == null)
        {
            return this.NotFound();
       }
        return this.Ok(rocket);
    }
    
    [HttpGet("{rocketId}/launch/{planetId}")]
    public async Task<IActionResult> LaunchRocket(int rocketId, int planetId)
    {
        var rocket = await this.rocketRepository.GetRocket(rocketId);
        if (rocket == null)
        {
            return this.NotFound();
        }
        var planet = await this.planetRepository.GetPlanet(planetId);
        if (planet == null)
        {
            return this.NotFound();
        }
        this.rocketRepository.VisitPlanet(rocket, planet);
        return this.Ok(rocket);
    }
}
```

# The Command Pattern

This is where the command pattern can come in handy. The command pattern moves logic from each action method and injected dependencies into their own class like so:

```cs
[Route("[controller]")]
public class RocketController : Controller
{
    private readonly Lazy<IGetRocketCommand> getRocketCommand;
    private readonly Lazy<ILaunchRocketCommand> launchRocketCommand;

    public RocketController(
        Lazy<IGetRocketCommand> getRocketCommand,
        Lazy<ILaunchRocketCommand> launchRocketCommand)
    {
        this.getRocketCommand = getRocketCommand;
        this.launchRocketCommand = launchRocketCommand;
    }

    [HttpGet("{rocketId}")]
    public Task<IActionResult> GetRocket(int rocketId) =>
        this.getRocketCommand.Value.ExecuteAsync(rocketId);

    [HttpGet("{rocketId}/launch/{planetId}")]
    public Task<IActionResult> LaunchRocket(int rocketId, int planetId) =>
        this.launchRocketCommand.Value.ExecuteAsync(rocketId, planetId);
}

public interface IGetRocketCommand : IAsyncCommand<int>
{
}

public class GetRocketCommand : IGetRocketCommand
{
    private readonly IRocketRepository rocketRepository;

    public GetRocketCommand(IRocketRepository rocketRepository) =>
        this.rocketRepository = rocketRepository;

    public async Task<IActionResult> ExecuteAsync(int rocketId)
    {
        var rocket = await this.rocketRepository.GetRocket(rocketId);
        if (rocket == null)
        {
            return new NotFoundResult();
        }
        return new OkObjectResult(rocket);
    }
}
```

All the logic and dependencies in the controllers gets moved to the command which now has a single responsibility. The controller now has a different set of dependencies, it now lazily injects one command per action method.

You may have noticed the `IAsyncCommand` interface. I keep four of these handy to inherit from. They all outline an `ExecuteAsync` method to execute the command and return an `IActionResult` but they have a differing number of parameters. I personally feel if you are needing more than three parameters you should be using a class to represent your parameters, so I've put the limit on three parameters.

```cs
public interface IAsyncCommand
{
    Task<IActionResult> ExecuteAsync();
}
public interface IAsyncCommand<T>
{
    Task<IActionResult> ExecuteAsync(T parameter);
}
public interface IAsyncCommand<T1, T2>
{
    Task<IActionResult> ExecuteAsync(T1 parameter1, T2 parameter2);
}
public interface IAsyncCommand<T1, T2, T3>
{
    Task<IActionResult> ExecuteAsync(T1 parameter1, T2 parameter2, T3 parameter3);
}
```

# Why so Lazy?

Why do we use `Lazy<T>`? Well the answer is that if we have multiple action methods on our controller, we don't want to instantiate the dependencies for every action method if we are only planning on using one action method. Registering our Lazy commands requires a bit of extra work in out `Startup.cs`. We can register lazy dependencies like so:

```cs
public void ConfigureServices(IServiceCollection services)
{
    // ...Omitted
    services
        .AddScoped<IGetRocketCommand, GetRocketCommand>()
        .AddScoped(x => new Lazy<IGetRocketCommand>(
            () => x.GetRequiredService<IGetRocketCommand>()));
}
```

# HttpContext and ActionContext

Now you might be thinking, how do I access the `HttpContext` or `ActionContext` if I want to set a HTTP header for example? Well, you can use the `IHttpContextAccessor` or `IActionContextAccessor` interfaces for this purpose. You can register them in your `Startup` class like so:

```cs
public void ConfigureServices(IServiceCollection services)
{
    // ...Omitted
    services
        .AddSingleton<IHttpContextAccessor, HttpContextAccessor>()
        .AddSingleton<IActionContextAccessor, ActionContextAccessor>();
}
```

Notice that they can be registered as singletons. You can then use them to get hold of the `HttpContext` or `ActionContext` objects for the current HTTP request. Here is a really simple example.

```cs
public class SetHttpHeaderCommand : ISetHttpHeaderCommand
{
    private readonly IHttpContextAccessor httpContextAccessor;

    public GetRocketCommand(IHttpContextAccessor httpContextAccessor) =>
        this.httpContextAccessor = httpContextAccessor;

    public async Task<IActionResult> ExecuteAsync()
    {
        this.httpContextAccessor.HttpContext.Response.Headers.Add("X-Rocket", "Saturn V");
        return new OkResult();
    }
}
```

# Unit Testing

Another upside to the command pattern is that testing each command becomes super simple. You don't need to setup a controller with lots of dependencies that you don't care about. You only need to write test code for that single feature.

# Conclusions

For a full working example, take a look at the [.NET Boxed API](https://github.com/Dotnet-Boxed/Templates/blob/master/Docs/API.md) project template which makes full use of the Lazy Command Pattern.
