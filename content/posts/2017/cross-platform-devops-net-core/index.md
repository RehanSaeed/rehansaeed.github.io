---
title: "Cross-Platform DevOps for .NET Core"
description: "Learn how to use Cake, AppVeyor and Travis CI continuous integration build systems to perform cross-platform DevOps for .NET Core based projects."
author: "Muhammad Rehan Saeed"
permalink: "/cross-platform-devops-net-core/"
heroImage: "/images/hero/Dotnet-Cake-AppVeyor-Travis-1366x768.png"
date: "2017-01-28"
dateModified: null
published: true
categories:
  - "Tools"
tags:
  - ".NET Core"
  - "AppVeyor"
  - "Build"
  - "Cake"
  - "Continuous Integration"
  - "DevOps"
  - "NuGet"
  - "Travis CI"
---

If you're a library author or writing a cross-platform application then .NET Core is great but it throws up the question, how do you test that your code works on all operating systems? Well the answer is simple, you build and test your code on each platform.

This post builds on [Andrew Lock's](http://andrewlock.net) work where he shows in two blog posts how to build, test and deploy your .NET Core NuGet packages using [AppVeyor](http://andrewlock.net/publishing-your-first-nuget-package-with-appveyor-and-myget/) (Windows) and [Travis CI](http://andrewlock.net/adding-travis-ci-to-a-net-core-app/) (Mac and Linux) continuous integration build systems.

In Andrew's blog posts, he writes PowerShell (Windows) or Bash (Mac and Linux) scripts to build, test and deploy his code. There were two problems here.

1. Code is duplicated because you have to write your shell scripts twice.
2. I've already grudgingly learned how to write PowerShell and done a little Bash but found both languages pretty ugly and difficult to use for more complex scenarios.

I only want to write my shell script once, I don't want to have to learn Bash in-depth and I don't want to write PowerShell if I can help it. Around the same time I was reading Andrew's blog posts, I read about [Cake](http://cakebuild.net/) build.

# Cake

Cake lets you write your build, test and deployment script in C# and it provides lots of helper methods to get stuff done making your script very terse. You can get syntax highlighting and intellisense for your Cake scripts by installing the [Visual Studio](https://marketplace.visualstudio.com/items?itemName=vs-publisher-1392591.CakeforVisualStudio) or [Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=cake-build.cake-vscode) extensions.

Building and testing your .NET Core code using Cake is dead dimple. Grab the `build.cake`, `build.ps1` and `build.sh` files from the Cake [Getting Started](http://cakebuild.net/docs/tutorials/getting-started) guide and drop them at the root of your project. Here is an example of my project and the files we'll be dealing with in this post:

![Cake Files](./images/CakeFiles.png)

The `build.ps1` and `build.sh` files are shell scripts that download the Cake executable and execute the build.cake C# script. They also take any parameters that are passed to them and pass them onto your cake script. Now paste the following into your `build.cake` file:

```cs
// Target - The task you want to start. Runs the Default task if not specified.
var target = Argument("Target", "Default");
// Configuration - The build configuration (Debug/Release) to use.
// 1. If command line parameter parameter passed, use that.
// 2. Otherwise if an Environment variable exists, use that.
var configuration = 
    HasArgument("Configuration") ? Argument("Configuration") :
    EnvironmentVariable("Configuration") != null ? EnvironmentVariable("Configuration") : "Release";
// The build number to use in the version number of the built NuGet packages.
// There are multiple ways this value can be passed, this is a common pattern.
// 1. If command line parameter parameter passed, use that.
// 2. Otherwise if running on AppVeyor, get it's build number.
// 3. Otherwise if running on Travis CI, get it's build number.
// 4. Otherwise if an Environment variable exists, use that.
// 5. Otherwise default the build number to 0.
var buildNumber =
    HasArgument("BuildNumber") ? Argument<int>("BuildNumber") :
    AppVeyor.IsRunningOnAppVeyor ? AppVeyor.Environment.Build.Number :
    TravisCI.IsRunningOnTravisCI ? TravisCI.Environment.Build.BuildNumber :
    EnvironmentVariable("BuildNumber") != null ? int.Parse(EnvironmentVariable("BuildNumber")) : 0;

// A directory path to an Artefacts directory.
var artefactsDirectory = Directory("./Artefacts");

// Deletes the contents of the Artefacts folder if it should contain anything from a previous build.
Task("Clean")
    .Does(() =>
    {
        CleanDirectory(artefactsDirectory);
    });

// Run dotnet restore to restore all package references.
Task("Restore")
    .IsDependentOn("Clean")
    .Does(() =>
    {
        DotNetCoreRestore();
    });

// Find all csproj projects and build them using the build configuration specified as an argument.
 Task("Build")
    .IsDependentOn("Restore")
    .Does(() =>
    {
        var projects = GetFiles("./**/*.csproj");
        foreach(var project in projects)
        {
            DotNetCoreBuild(
                project.GetDirectory().FullPath,
                new DotNetCoreBuildSettings()
                {
                    Configuration = configuration
                });
        }
    });

// Look under a 'Tests' folder and run dotnet test against all of those projects.
// Then drop the XML test results file in the Artefacts folder at the root.
Task("Test")
    .IsDependentOn("Build")
    .Does(() =>
    {
        var projects = GetFiles("./Tests/**/*.csproj");
        foreach(var project in projects)
        {
            DotNetCoreTest(
                project.GetDirectory().FullPath,
                new DotNetCoreTestSettings()
                {
                    ArgumentCustomization = args => args
                        .Append("-xml")
                        .Append(artefactsDirectory.Path.CombineWithFilePath(project.GetFilenameWithoutExtension()).FullPath + ".xml"),
                    Configuration = configuration,
                    NoBuild = true
                });
        }
    });

// Run dotnet pack to produce NuGet packages from our projects. Versions the package
// using the build number argument on the script which is used as the revision number 
// (Last number in 1.0.0.0). The packages are dropped in the Artefacts directory.
Task("Pack")
    .IsDependentOn("Test")
    .Does(() =>
    {
        var revision = buildNumber.ToString("D4");
        foreach (var project in GetFiles("./Source/**/*.csproj"))
        {
            DotNetCorePack(
                project.GetDirectory().FullPath,
                new DotNetCorePackSettings()
                {
                    Configuration = configuration,
                    OutputDirectory = artefactsDirectory,
                    VersionSuffix = revision
                });
        }
    });

// The default task to run if none is explicitly specified. In this case, we want
// to run everything starting from Clean, all the way up to Pack.
Task("Default")
    .IsDependentOn("Pack");

// Executes the task specified in the target argument.
RunTarget(target);
```

At the top of the script some arguments are defined. Values for these arguments can be set by passing values to the shell scripts via command line, they can come from environment variables or they can come from continuous integration build systems that Cake knows about (It knows all the common ones including TFS, TeamCity, Jenkins and Bamboo). In the above script I show how to get a build number from AppVeyor or Travis CI if the script is currently being run using those systems. This makes the code very short, terse and to the point.

The rest of the script is made up of a series of chained tasks which execute one after the other, starting with the task with no dependencies. Alternatively you can pass in a Target argument which specifies which task you'd like the script to start executing from. A key thing to note is that the script does not need to know about any file names or file paths, everything is done by convention.

One very important effect of using Cake is that your build script is easily testable. I've used many continuous integration systems that have their own proprietary tasks and when a slower build fails, debugging it was a nightmare, since it could only be done on the build machine. Since Cake is just a script, you can run it on your local machine and test it to your hearts content which gives you a quicker tighter development loop.

# AppVeyor

[AppVeyor](https://www.appveyor.com/docs/) is my favourite CI system but only works if you are hosting your code with Git based repositories and it only runs builds on Windows. All you need to do is sign-up, enable AppVeyor for your git repository and add an `appveyor.yml` file which is in [YAML](https://en.wikipedia.org/wiki/YAML) format. Here is one of my commented `appveyor.yml` files:

```yaml
version: '{build}'

pull_requests:
  # Do not increment build number for pull requests
  do_not_increment_build_number: true

nuget:
  # Do not publish NuGet packages for pull requests
  disable_publish_on_pr: true

environment:
  # Set the DOTNET_SKIP_FIRST_TIME_EXPERIENCE environment variable to stop wasting time caching packages
  DOTNET_SKIP_FIRST_TIME_EXPERIENCE: true
  # Disable sending usage data to Microsoft
  DOTNET_CLI_TELEMETRY_OPTOUT: true

build_script:
- ps: .\build.ps1

test: off

artifacts:
# Store NuGet packages
- path: .\Artefacts\**\*.nupkg
  name: NuGet
# Store xUnit Test Results
- path: .\Artefacts\**\*.xml
  name: xUnit Test Results

deploy:

# Publish NuGet packages
- provider: NuGet
  name: production
  api_key:
    secure: 73eFUWSfho6pxCy1VRP1H0AYh/SFiyEREV+/ATcoj0I+sSH9dec/WXs6H2Jy5vlS
  on:
    # Only publish from the master branch
    branch: master
    # Only publish if the trigger was a Git tag
    # git tag v0.1.0-beta
    # git push origin --tags
    appveyor_repo_tag: true
```

It basically executes the `build.ps1` file at the root of my project and collects all the NuGet package and XML unit test result files in my artefacts folder. I also set some environment variables to turn off some lesser known .NET Core features for a faster build.

AppVeyor, knows about NuGet and I use AppVeyor as my primary build system to publish my NuGet packages (You don't want AppVeyor and Travis CI both publishing your NuGet packages). Now I could have created a task in my cake file to publish NuGet packages and only execute that task if I was running on AppVeyor but AppVeyor has a pretty easy to use configuration file that I've chosen to do this step instead.

To publish packages to NuGet, you sign-up and receive an API key. Of course, you don't want to share that with the whole world by checking it into GitHub or Bitbucket, so AppVeyor lets you [encrypt](https://ci.appveyor.com/tools/encrypt) it and paste the encrypted value into the `appveyor.yml` file.

# Travis CI

[Travis CI](https://travis-ci.org/) is very similar to AppVeyor but it targets both Mac and Linux. All you have to do is sign-up, turn on Travis for your repository and stick a `.travis.yml` file in the root of your project. Here is mine:

```yaml
language: csharp
os:
  - linux
  - osx

# .NET CLI require Ubuntu 14.04
sudo: required
dist: trusty
addons:
  apt:
    packages:
    - gettext
    - libcurl4-openssl-dev
    - libicu-dev
    - libssl-dev
    - libunwind8
    - zlib1g

# .NET CLI requires OSX 10.11
osx_image: xcode7.2

# Ensure that .NET Core is installed
dotnet: 1.0.0-preview2-1-003177
# Ensure Mono is installed
mono: latest

env:
    # Set the DOTNET_SKIP_FIRST_TIME_EXPERIENCE environment variable to stop wasting time caching packages
  - DOTNET_SKIP_FIRST_TIME_EXPERIENCE=true
    # Disable sending usage data to Microsoft
  - DOTNET_CLI_TELEMETRY_OPTOUT=true

# You must run this command to give Travis permissions to execute the build.sh shell script:
# git update-index --chmod=+x build.sh
script:
  - ./build.sh
```

You'll notice that we are specifying that we want to build our code on both Mac and Linux. Travis CI will actually run one build for each operating system. We then specify some details about the version of operating system we want to use and what we would like to install on them.

Once again, I set the .NET environment variables to make the build a bit quicker and finally we run the `build.sh` Bash script to kick things off. Note that you need to run the following command to give Travis permission to execute the build.sh file (This is Linux after all):

```powershell
git update-index --chmod=+x build.sh
```

Another thing to note is that if you are still using the older `xproj` project system and your unit tests are using xUnit, then your tests will not run due to this [bug](https://github.com/dotnet/cli/issues/3073). There is a very nasty workaround in the link.

# Conclusions

If you want to learn how to add AppVeyor and Travis CI build status badges to your Git repository ReadMe or learn how to deploy to MyGet/NuGet using tags, I recommend going back to read Andrew's blog post which is still useful. If you're looking for more examples of Cake build scripts, you can take a look at the following Cake repositories:

- [Cake](https://github.com/cake-build/cake) - Cake builds itself with Cake! They have a very complicated build setup. This repository is great for learning about Cake helper methods that you can use in your scripts.
- [Serilog.Exceptions](https://github.com/RehanSaeed/Serilog.Exceptions) - Builds, tests and deploys .NET Core NuGet packages.
- [.NET Boxed Framework](https://github.com/Dotnet-Boxed/Framework) - Builds, tests and deploys .NET Core NuGet packages.
- [.NET Boxed Templates](https://github.com/Dotnet-Boxed/Templates) - Builds, tests and deploys a `dotnet new` NuGet package.
