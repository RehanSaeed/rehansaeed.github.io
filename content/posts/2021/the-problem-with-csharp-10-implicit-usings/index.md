---
title: "The Problem with C# 10 Implicit Usings"
description: "I tried using C# 10 implicit using statements and found that they had a fatal flaw which meant you couldn't use them under certain circumstances"
author: "Muhammad Rehan Saeed"
permalink: "/the-problem-with-csharp-10-implicit-usings/"
heroImage: "/images/hero/Microsoft-.NET-1366x768.png"
date: "2021-10-13T09:24:00Z"
dateModified: null
published: true
categories:
  - "C#"
tags:
  - "C# 10"
  - ".NET"
  - "Implicit Using Statements"
---

::: tip Update (2021-10-14)
[Mark Rendle](https://twitter.com/markrendle) made an interesting suggestion on Twitter after seeing this blog post. I've updated the post below with his code.
:::

Yesterday I livestreamed myself upgrading a project to .NET 6 and C# 10. Along the way I tried using a new C# 10 feature called [implicit using statements](https://docs.microsoft.com/en-us/dotnet/core/compatibility/sdk/6.0/implicit-namespaces) and discovered that it wasn't quite as straightforward as I first thought and you should probably not use it under certain circumstances.

Here is the live stream for those who are interested (I'm eager to get any feedback on how I'm presenting as its not a natural skill for me):

https://www.youtube.com/watch?v=FjnS4oF8K3E

# What are Implicit Using Statements?

Adding the line below to your `.csproj` project file turns the feature on:

```xml
<ImplicitUsings>enable</ImplicitUsings>
```

Once enabled, depending on the type of project you have created you'll have the following global using statements added to your project implicitly.

| SDK                      | Default namespaces                                                                                                                                                                                                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Microsoft.NET.Sdk        | `System`<br>`System.Collections.Generic`<br>`System.IO`<br>`System.Linq`<br>`System.Net.Http`<br>`System.Threading`<br>`System.Threading.Tasks`                                                                                                                                                                       |
| Microsoft.NET.Sdk.Web    | `System.Net.Http.Json`<br>`Microsoft.AspNetCore.Builder`<br>`Microsoft.AspNetCore.Hosting`<br>`Microsoft.AspNetCore.Http`<br>`Microsoft.AspNetCore.Routing`<br>`Microsoft.Extensions.Configuration`<br>`Microsoft.Extensions.DependencyInjection`<br>`Microsoft.Extensions.Hosting`<br>`Microsoft.Extensions.Logging` |
| Microsoft.NET.Sdk.Worker | `Microsoft.Extensions.Configuration`<br>`Microsoft.Extensions.DependencyInjection`<br>`Microsoft.Extensions.Hosting`<br>`Microsoft.Extensions.Logging`                                                                                                                                                                |

Sounds great, now you can delete a large portion of the using statements in your project right? Well not so fast, here are some problems I discovered along the way.

## Build Errors

I discovered the first problem while multi-targetting a class library project for a NuGet package. I had targetted .NET 4.7.2 as well as other target frameworks like .NET 6 for backwards compatibility and found that `System.Net.Http` could not be found. It turns out I hadn't referenced that particular NuGet package for .NET 4.7.2 and was now getting a build error.

I could add the `System.Net.Http` NuGet package for .NET 4.7.2 on its own and that would solve the problem but I really didn't like having the overhead of another unnecessary package reference. That also means extra work for me to maintain updating the version number or relying on tools like [Dependabot](https://dependabot.com/) and [Renovate](https://www.whitesourcesoftware.com/free-developer-tools/renovate/) to submit PR's to upgrade the version number for me.

```xml
<ItemGroup Label="Package References (.NET 4.7.2)" Condition="'$(TargetFramework)' == 'net472'">
    <PackageReference Include="System.Net.Http" Version="4.3.4" />
</ItemGroup>
```

[Mark Rendle](https://twitter.com/markrendle) on Twitter suggested another workaround after seeing this blog post. His suggestion was to remove the offending using statement in the `.csproj` file.

```xml
<ItemGroup>
    <Using Remove="System.Net.Http" />
</ItemGroup>
```

This looks awfully strange to me. I'm not sure how I feel about adding or removing namespaces from C# project files yet. It doesn't seem very discoverable to me. So in this particular case I'm happy to avoid using implicit using statements for now.

## What Using's Were Added?

The second problem is trying to understand what using's have been added. As you can see from the table above, you could go and look in the [documentation](https://docs.microsoft.com/en-us/dotnet/core/compatibility/sdk/6.0/implicit-namespaces) to figure this out but that's slow and time consuming. Another alternative is actually to build your project and then look in its `obj` directory under:

```
My.Project\obj\Debug\net472\My.Project.GlobalUsings.g.cs
```

That's not idea either. I think Visual Studio should ideally show you these using statements somehow.

# Conclusions

Implicit usings are [enabled by default](https://devblogs.microsoft.com/dotnet/announcing-net-6-release-candidate-2/#net-sdk-c-project-templates-modernized) in the latest blank project templates shipped with .NET. Overall this is a cool feature that can remove the need for many duplicated lines of code in your project but I think there is a little too much magic going on here for my liking, so I think I'll be more careful about using this feature in the future.
