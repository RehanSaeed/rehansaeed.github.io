---
title: "Unit Testing dotnet new Templates"
description: "It's difficult to know if your 'dotnet new' based project will work if they have lots of options, in this post I show how to unit test them."
author: "Muhammad Rehan Saeed"
permalink: "/unit-testing-dotnet-new-templates/"
cover_image: "/images/hero/NET-1366x768.png"
date: "2019-08-21"
published: true
categories:
  - "Tools"
tags:
  - ".NET"
  - "dotnet"
  - "dotnet new"
  - "NuGet"
  - "Project Template"
---

- [Part 1 - Custom Project Templates Using dotnet new](/custom-project-templates-using-dotnet-new/)
- [Part 2 - dotnet new Feature Selection](/dotnet-new-feature-selection/)
- [Part 3 - Unit Testing dotnet new Templates](/unit-testing-dotnet-new-templates/)

As I talked about in my previous post some time ago about dotnet new project templates, it's possible to enable feature selection, so that developers can toggle certain features of a project template on or off. This is not a feature that many templates in the wild use a lot. Quite often I've seen templates have no optional features or only a few. One reason is that it gets very complicated to test that toggling your optional features doesn't break the generated project in some way by stopping it from building for example. This is why I decided to write a small unit test helper library for dotnet new project templates. It is unit test framework agnostic and can work with xUnit, NUnit, MSTest or any other unit test framework.

## Example Usage

Below is an example showing how you can use it inside an xUnit test project.

```cs
public class ApiTemplateTest
{
    public ApiTemplateTest() => DotnetNew.Install<ApiTemplateTest>("ApiTemplate.sln").Wait();

    [Theory]
    [InlineData("StatusEndpointOn", "status-endpoint=true")]
    [InlineData("StatusEndpointOff", "status-endpoint=false")]
    public async Task RestoreAndBuild_CustomArguments_IsSuccessful(string name, params string[] arguments)
    {
        using (var tempDirectory = TempDirectory.NewTempDirectory())
        {
            var dictionary = arguments
                .Select(x => x.Split('=', StringSplitOptions.RemoveEmptyEntries))
                .ToDictionary(x => x.First(), x => x.Last());
            var project = await tempDirectory.DotnetNew("api", name, dictionary);
            await project.DotnetRestore();
            await project.DotnetBuild();
        }
    }

    [Fact]
    public async Task Run_DefaultArguments_IsSuccessful()
    {
        using (var tempDirectory = TempDirectory.NewTempDirectory())
        {
            var project = await tempDirectory.DotnetNew("api", "DefaultArguments");
            await project.DotnetRestore();
            await project.DotnetBuild();
            await project.DotnetRun(
                @"Source\DefaultArguments",
                async (httpClient, httpsClient) =>
                {
                    var httpResponse = await httpsClient.GetAsync("status");
                    Assert.Equal(HttpStatusCode.OK, httpResponse.StatusCode);
                });
        }
    }
}
```

The first thing it does in the constructor is install the dotnet new project templates in your solution. It needs to know the name of the solution file. It then walks the sub-directory tree below your solution file and installs all project templates for you.

If we then look at the first unit test, we first need a temporary directory, where we can create a project from our dotnet new project template. We will generate a project from the template in this directory and then delete the directory at the end of the test. We then run dotnet new with the name of a project template, the name we want to give to the generated project and any custom arguments that particular project template supports. Using xUnit, I've parametrised the arguments, so we can run multiple tests while tweaking the arguments for each test. Running DotnetNew returns a project which contains some metadata about the project that we've just created and we can also use it to further dotnet commands against.

Finally, we run dotnet restore and dotnet build against the project. So this test ensures that toggling the StatusEndpointOn option on our project template doesn't stop the generated project from restoring NuGet packages or building successfully.

The second unit test method is where it gets really cool. If the project template is an ASP.NET Core project, we can use dotnet run to start the project listening on some random free ports on the machine. The unit test framework then gives you two HttpClient's (One for HTTP and one for HTTPS) with which to call your newly generated project. In summary, not only can you test that the generated projects build, you can test that the features in your generated project work as they should.

This API is pretty similar to the ASP.NET Core TestHost API that also gives you a HttpClient to test the API with. The difference is that this framework is actually running the app using the dotnet run command. I have experimented with using the TestHost API to run the generated project in memory, so it could be run a bit faster but the .NET Core API's for dynamically loading DLL files needs some work which .NET Core 3.0 might solve.

## Where To Get It?

You can download the [Boxed.DotnetNewTest](https://www.nuget.org/packages/Boxed.DotnetNewTest/) NuGet package or see the [source code](https://github.com/Dotnet-Boxed/Framework#boxeddotnetnewtest) on GitHub.
