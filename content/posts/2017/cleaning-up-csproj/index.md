---
title: "Cleaning Up CSPROJ"
description: "I show how to make the new Visual Studio 2017 .NET Core based csproj XML concise and pretty for hand editing."
author: "Muhammad Rehan Saeed"
permalink: "/cleaning-up-csproj/"
heroImage: "/images/hero/Cleaning-Up-CSPROJ-1366x768.png"
date: "2017-03-18"
dateModified: null
published: true
categories:
  - ".NET"
tags:
  - ".NET"
  - ".NET Core"
  - "csproj"
  - "MSBuild"
  - "project.json"
  - "SDK"
  - "Visual Studio 2017"
  - "xproj"
---

::: tip TLDR
I show how to make `csproj` XML concise and pretty for hand editing.
:::

I used `project.json` since Beta 7 and got used to hand editing it, I've continues that practice with `.csproj` files and I think you should too. Recent version of Visual Studio have made a lot of performance improvements but it's still a lot slower than hand editing a text file.

The NuGet package screen in Visual Studio is achingly slow. Bulk editing takes seconds. I can update NuGet package references, package properties etc. all in one go, rather than visiting multiple disparate UI's in Visual Studio. Finally, I create new projects by copying and pasting an existing `csproj` and tweaking it. Much faster than Visual Studio's New Project dialogue.

# Install Project File Tools

The [Project File Tools](https://marketplace.visualstudio.com/items?itemName=ms-madsk.ProjectFileTools) Visual Studio extension gives you intellisense for NuGet packages in the new `csproj` projects. Unfortunately, due to MSBuild being around for so long and being so complex, intellisense for the rest of the project XML consists of a massive list of possible properties so it becomes less useful than it was in `project.json`.

# dotnet migrate - Wow that's ugly!

After migrating my `project.json` projects to `csproj` using Visual Studio 2017 (You could also use the `dotnet migrate` command), I found that that the XML generated was pretty ugly and contained superfluous elements you just didn't need. Here is an example `csproj` library project straight after migration:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <Description>...</Description>
    <Copyright>Copyright © Muhammad Rehan Saeed. All rights Reserved</Copyright>
    <AssemblyTitle>Dotnet Boxed Framework</AssemblyTitle>
    <VersionPrefix>2.2.2</VersionPrefix>
    <Authors>Muhammad Rehan Saeed (RehanSaeed.com)</Authors>
    <TargetFrameworks>netstandard1.6;net461</TargetFrameworks>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <AssemblyName>Boxed.AspNetCore</AssemblyName>
    <AssemblyOriginatorKeyFile>../../../Key.snk</AssemblyOriginatorKeyFile>
    <SignAssembly>true</SignAssembly>
    <PublicSign Condition=" '$(OS)' != 'Windows_NT' ">true</PublicSign>
    <PackageId>Boxed.AspNetCore</PackageId>
    <PackageTags>ASP.NET;ASP.NET Core;MVC;Boxed;Muhammad Rehan Saeed;Framework</PackageTags>
    <PackageReleaseNotes>Updated to ASP.NET Core 1.1.2.</PackageReleaseNotes>
    <PackageIconUrl>https://raw.githubusercontent.com/Dotnet-Boxed/Framework/master/Images/Icon.png</PackageIconUrl>
    <PackageProjectUrl>https://github.com/Dotnet-Boxed/Framework</PackageProjectUrl>
    <PackageLicenseUrl>https://github.com/Dotnet-Boxed/Framework/blob/master/LICENSE</PackageLicenseUrl>
    <PackageRequireLicenseAcceptance>true</PackageRequireLicenseAcceptance>
    <RepositoryType>git</RepositoryType>
    <RepositoryUrl>https://github.com/Dotnet-Boxed/Framework.git</RepositoryUrl>
    <GenerateAssemblyConfigurationAttribute>false</GenerateAssemblyConfigurationAttribute>
    <GenerateAssemblyCompanyAttribute>false</GenerateAssemblyCompanyAttribute>
    <GenerateAssemblyProductAttribute>false</GenerateAssemblyProductAttribute>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\Framework\Framework.csproj" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Abstractions" Version="1.1.2" />
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Core" Version="1.1.2" />
    <PackageReference Include="Microsoft.Extensions.Caching.Abstractions" Version="1.1.1" />
    <PackageReference Include="Microsoft.Extensions.Configuration.Binder" Version="1.1.1" />
    <PackageReference Include="Newtonsoft.Json" Version="9.0.1" />
    <PackageReference Include="StyleCop.Analyzers" Version="1.0.0">
      <PrivateAssets>All</PrivateAssets>
    </PackageReference>
  </ItemGroup>

  <ItemGroup Condition=" '$(TargetFramework)' == 'netstandard1.6' ">
    <PackageReference Include="System.Xml.XDocument" Version="4.3.0" />
  </ItemGroup>

  <ItemGroup Condition=" '$(TargetFramework)' == 'net461' ">
    <Reference Include="System.ServiceModel" />
    <Reference Include="System.Xml" />
    <Reference Include="System.Xml.Linq" />
    <Reference Include="System" />
    <Reference Include="Microsoft.CSharp" />
  </ItemGroup>

</Project>
```

## Understanding new csproj Projects

The top of the project contains a new SDK property. This imports some MSBuild targets and props files in your `dotnet` installation folder shown below:

![dotnet SDK's](./images/Dotnet-SDKs.png)

If you root around in those files, you can find defaults for all kinds of settings. Here are some of the nuggets I discovered about the web projects:

- The `NETStandard.Library` version `1.6.1` NuGet package is referenced for you by default.
- The `wwwroot` folder is excluded from compilation but included in the published output.
- `web.config`, `.cshtml` and `.json` files are published by default.
- Server garbage collection is turned on by default using the `ServerGarbageCollection` setting.
- `PreserveCompilationContext` is set to true by default.
- `node_modules`, `jspm_packages` and `bower_components` are excluded by default.

## AssemblyInfo.cs is Partially Dead

You don't need `AssemblyInfo.cs` anymore by default as the `csproj` Package settings also set many of the assembly attributes. In fact, you didn't really need it with `project.json` either but the default templates mostly included it for some reason. However, I still found I needed to resurrect it in some cases to use the `InternalsVisibleTo` attribute. `InternalsVisibleTo` allows my unit test projects to access internal members in my library project. After a `dotnet migrate`, you may see the following elements which stop certain assembly attributes from being generated. You can safely delete these.

```xml
<PropertyGroup>
  <!-- ...Omitted -->
  <GenerateAssemblyConfigurationAttribute>false</GenerateAssemblyConfigurationAttribute>
  <GenerateAssemblyCompanyAttribute>false</GenerateAssemblyCompanyAttribute>
  <GenerateAssemblyProductAttribute>false</GenerateAssemblyProductAttribute>
<PropertyGroup>
```

## Remove System.* References

You no longer need to explicitly reference `System.*` references in your `csproj`. David Fowler recommends that you always reference the `NETStandard.Library` meta NuGet package gives you most `System.*` references. You get `NETStandard.Library` by default if you use the SDK attribute at the top of the `csproj`:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <!-- ...Omitted -->
</Project>
```

This meant that I could remove the entire code block below except `System.ServiceModel` because that reference is not given to you by the `NETStandard.Library` NuGet package.

```xml
<ItemGroup Condition=" '$(TargetFramework)' == 'netstandard1.6' ">
  <PackageReference Include="System.Xml.XDocument" Version="4.3.0" />
</ItemGroup>

<ItemGroup Condition=" '$(TargetFramework)' == 'net461' ">
  <Reference Include="System.ServiceModel" />
  <Reference Include="System.Xml" />
  <Reference Include="System.Xml.Linq" />
  <Reference Include="System" />
  <Reference Include="Microsoft.CSharp" />
</ItemGroup>
```

## Turn Elements into Attributes

For some reason dotnet migrate produces overly verbose XML in some cases by outputting XML elements instead of attributes. I have a NuGet reference to `StyleCop.Analyzers` which is a build time dependency and I don't want it to be output to my bin directory. You do this by setting the `PrivateAssets` property but you can turn this:

```xml
<PackageReference Include="StyleCop.Analyzers" Version="1.0.0">
  <PrivateAssets>All</PrivateAssets>
</PackageReference>
```

Into this:

```xml
<PackageReference Include="StyleCop.Analyzers" PrivateAssets="All" Version="1.0.0" />
```

## Label your Sections

You can label your `PropertyGroup` and `ItemGroup` elements using the `Label` attribute:

```xml
<PropertyGroup Label="Package">
  <!-- NuGet Packages Omitted -->
</PropertyGroup>
```

So the question becomes, how should we label them? Well, the convention I use is to use the same label names as the ones in Visual Studio's project properties screen:

![Project Properties Tabs](./images/Project-Properties-Tabs.png)

# The End Result

This is what my `csproj` looks like at the end of all that. I've removed all the extra fluff you don't need and labelled the properties in a way that makes navigating the file with your eye that much quicker.

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup Label="Build">
    <TargetFrameworks>netstandard1.6;net461</TargetFrameworks>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <CodeAnalysisRuleSet>../../../MinimumRecommendedRulesWithStyleCop.ruleset</CodeAnalysisRuleSet>
  </PropertyGroup>

  <PropertyGroup Label="Package">
    <VersionPrefix>2.2.2</VersionPrefix>
    <Authors>Muhammad Rehan Saeed (RehanSaeed.com)</Authors>
    <Product>Dotnet Boxed Framework</Product>
    <Description>...</Description>
    <Copyright>Copyright © Muhammad Rehan Saeed. All rights Reserved</Copyright>
    <PackageRequireLicenseAcceptance>true</PackageRequireLicenseAcceptance>
    <PackageLicenseUrl>https://github.com/Dotnet-Boxed/Framework/blob/master/LICENSE</PackageLicenseUrl>
    <PackageProjectUrl>https://github.com/Dotnet-Boxed/Framework</PackageProjectUrl>
    <PackageIconUrl>https://raw.githubusercontent.com/Dotnet-Boxed/Framework/master/Images/Icon.png</PackageIconUrl>
    <RepositoryUrl>https://github.com/Dotnet-Boxed/Framework.git</RepositoryUrl>
    <RepositoryType>git</RepositoryType>
    <PackageTags>ASP.NET;ASP.NET Core;MVC;Boxed;Muhammad Rehan Saeed;Framework</PackageTags>
    <PackageReleaseNotes>Updated to ASP.NET Core 1.1.2.</PackageReleaseNotes>
  </PropertyGroup>
  
  <PropertyGroup Label="Signing">
    <SignAssembly>true</SignAssembly>
    <AssemblyOriginatorKeyFile>../../../Key.snk</AssemblyOriginatorKeyFile>
    <PublicSign Condition=" '$(OS)' != 'Windows_NT' ">true</PublicSign>
  </PropertyGroup>

  <ItemGroup Label="Project References">
    <ProjectReference Include="..\Boilerplate\Boilerplate.csproj" />
  </ItemGroup>

  <ItemGroup Label="Package References">
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Abstractions" Version="1.1.2" />
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Core" Version="1.1.2" />
    <PackageReference Include="Microsoft.Extensions.Caching.Abstractions" Version="1.1.1" />
    <PackageReference Include="Microsoft.Extensions.Configuration.Binder" Version="1.1.1" />
    <PackageReference Include="Newtonsoft.Json" Version="9.0.1" />
    <PackageReference Include="StyleCop.Analyzers" PrivateAssets="All" Version="1.0.0" />
  </ItemGroup>

  <ItemGroup Condition=" '$(TargetFramework)' == 'net461' " Label=".NET 4.6.1 Package References">
    <Reference Include="System.ServiceModel" />
  </ItemGroup>

</Project>
```
