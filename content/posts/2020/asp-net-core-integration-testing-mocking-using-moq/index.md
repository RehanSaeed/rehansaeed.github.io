---
title: "ASP.NET Core Integration Testing & Mocking using Moq"
description: "Mocking services using Moq while integration testing ASP.NET Core applications in memory."
author: "Muhammad Rehan Saeed"
permalink: "/asp-net-core-integration-testing-mocking-using-moq/"
cover_image: "./images/hero/NET-1366x768.png"
date: "2020-01-03"
published: true
categories:
  - "ASP.NET"
tags:
  - "ASP.NET Core"
  - "Integration Tests"
  - "Mock"
  - "Moq"
  - "xUnit"
---

If you want to run an integration test for your ASP.NET Core app without also testing lots of external dependencies like databases and the like, then the **lengthy** official '[Integration tests in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-2.2)' documentation shows how you can use stubs to replace code that talks to a database or some other external service. If you want to use mocks using [Moq](https://github.com/moq/moq4), this is where you run out of guidance and runway. It does in fact require a fair amount of setup to do it correctly and reliably without getting flaky tests.

# Startup

The `ConfigureServices` and `Configure` methods in your applications `Startup` class must be `virtual`. This is so that we can inherit from this class in our tests and replace production versions of certain services with mock versions.

```cs
public class Startup
{
    private readonly IConfiguration configuration;
    private readonly IWebHostingEnvironment webHostingEnvironment;

    public Startup(
        IConfiguration configuration,
        IWebHostingEnvironment webHostingEnvironment)
    {
        this.configuration = configuration;
        this.webHostingEnvironment = webHostingEnvironment;
    }

    public virtual void ConfigureServices(IServiceCollection services) => ...

    public virtual void Configure(IApplicationBuilder application) => ...
}
```

# TestStartup

In your test project, inherit from the `Startup` class and override the `ConfigureServices` method with one that registers the mock and the mock object with IoC container.

I like to use strict mocks using `MockBehavior.Strict`, this ensures that nothing is mocked unless I specifically setup a mock.

```cs
public class TestStartup : Startup
{
    private readonly Mock clockServiceMock;

    public TestStartup(
        IConfiguration configuration,
        IHostingEnvironment hostingEnvironment)
        : base(configuration, hostingEnvironment)
    {
        this.clockServiceMock = new Mock(MockBehavior.Strict);
    }

    public override void ConfigureServices(IServiceCollection services)
    {
        services
            .AddSingleton(this.clockServiceMock);

        base.ConfigureServices(services);

        services
            .AddSingleton(this.clockServiceMock.Object);
    }
}
```

# CustomWebApplicationFactory

In your test project, write a custom `WebApplicationFactory` that configures the `HttpClient` and resolves the mocks from the `TestStartup`, then exposes them as properties, ready for our integration test to consume them. Note that I'm also changing the environment to `Testing` and telling it to use the `TestStartup` class for startup.

Note also that I've implemented `IDisposable`'s `Dispose` method to verify all of my strict mocks. This means I don't need to verify any mocks manually myself. Verification of all mock setups happens automatically when xUnit is disposing the test class.

```cs
public class CustomWebApplicationFactory : WebApplicationFactory
    where TEntryPoint : class
{
    public CustomWebApplicationFactory()
    {
        this.ClientOptions.AllowAutoRedirect = false;
        this.ClientOptions.BaseAddress = new Uri("https://localhost");
    }

    public ApplicationOptions ApplicationOptions { get; private set; }

    public Mock ClockServiceMock { get; private set; }

    public void VerifyAllMocks() => Mock.VerifyAll(this.ClockServiceMock);

    protected override void ConfigureClient(HttpClient client)
    {
        using (var serviceScope = this.Services.CreateScope())
        {
            var serviceProvider = serviceScope.ServiceProvider;
            this.ApplicationOptions = serviceProvider
                .GetRequiredService<IOptions<ApplicationOptions>>().Value;
            this.ClockServiceMock = serviceProvider
                .GetRequiredService<Mock<IClockService>>();
        }

        base.ConfigureClient(client);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder) =>
        builder
            .UseEnvironment("Testing")
            .UseStartup();

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            this.VerifyAllMocks();
        }

        base.Dispose(disposing);
    }
}
```

# Integration Tests

I'm using xUnit to write my tests. Note that the generic type passed to `CustomWebApplicationFactory` is `Startup` and not `TestStartup`. This generic type is used to find the location of your application project on disk and not to start the application.

I setup a mock in my test and I've implemented `IDisposable` to verify all mocks for all my tests at the end but you can do this step in the test method itself if you like.

Note also, that I'm not using xUnit's `IClassFixture` to only boot up the application once as the ASP.NET Core documentation tells you to do. If I did so, I'd have to reset the mocks between each test and also you would only be able to run the integration tests serially one at a time. With the method below, each test is fully isolated and they can be run in parallel. This uses up more CPU and each test takes longer to execute but I think it's worth it.

```cs
public class FooControllerTest : CustomWebApplicationFactory
{
    private readonly HttpClient client;
    private readonly Mock clockServiceMock;

    public FooControllerTest()
    {
        this.client = this.CreateClient();
        this.clockServiceMock = this.ClockServiceMock;
    }

    [Fact]
    public async Task GetFoo_Default_Returns200OK()
    {
        this.clockServiceMock
            .Setup(x => x.UtcNow)
            .ReturnsAsync(new DateTimeOffset(2000, 1, 1));

        var response = await this.client.GetAsync("/foo");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
```

# xunit.runner.json

I'm using xUnit. We need to turn off shadow copying, so any separate files like `appsettings.json` are placed in the right place beside the application DLL file. This ensures that our application running in an integration test can still read the `appsettings.json` file.

```json
{
  "shadowCopy": false
}
```

# appsettings.Testing.json

Should you have configuration that you want to change just for your integration tests, you can add a `appsettings.Testing.json` file into your application. This configuration file will only be read in our integration tests because we set the environment name to 'Testing'.

## Working Examples

If you'd like to see an end to end working example of how this all works. You can create a project using the [Dotnet Boxed](https://github.com/Dotnet-Boxed/Templates) [API project template](https://github.com/Dotnet-Boxed/Templates/blob/master/Docs/API.md) or the [GraphQL project template](https://github.com/Dotnet-Boxed/Templates/blob/master/Docs/GraphQL.md).

## Conclusions

I wrote this because there is little to no information on how to combine ASP.NET Core with Moq in integration tests. I've messed about with using `IClassFixture` as the ASP.NET Core documentation tells you to do and it's just not a good idea with Moq which needs a clean slate before each test. I hope this stops others going through much pain.
