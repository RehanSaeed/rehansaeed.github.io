---
title: "Securing ASP.NET Core in Docker"
description: "How to secure your ASP.NET Core Docker image by setting the file system to be read-only. First in a series of blog posts covering Docker image security."
author: "Muhammad Rehan Saeed"
permalink: "/securing-asp-net-core-in-docker/"
heroImage: "/images/hero/Docker-1366x768.png"
date: "2019-03-25"
dateModified: null
published: true
categories:
  - "Docker"
tags:
  - "ASP.NET Core"
  - "Docker"
  - "Docker Swarm"
  - "Kubernetes"
---

::: warning Update (2020-10-12)
Making the file system for an ASP.NET Core application read-only is great for security but under high load ASP.NET Core can buffer requests to disk. In this scenario, you will see exceptions. So weight the positives and negatives of doing this.
:::

Some time ago, I blogged about how you can get some [extra security when running Docker containers](/docker-read-file-systems/) by making their file systems read-only. This ensures that should an attacker get into the container somehow, they won't be able to change any files. This only works with certain containers that support it however and unfortunately, at that time ASP.NET Core did not support running in a Docker container with a read-only file system. Happily, this is now fixed!

Lets see an example. I created a brand new hello world ASP.NET Core project and added this `Dockerfile`:

```dockerfile
FROM microsoft/dotnet:2.2-sdk AS builder
WORKDIR /source
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish --output /app/ --configuration Release

FROM microsoft/dotnet:2.2-aspnetcore-runtime
WORKDIR /app
COPY --from=builder /app .
ENTRYPOINT ["dotnet", "ReadOnlyTest.dll"]
```

I build the Docker image using this command:

```powershell
docker build -t read-only-test .
```

If I run this image with a read-only file system:

```powershell
docker run --rm --read-only -it -p 8000:80 read-only-test
```

This outputs the following error as read-only file systems are not supported by default:

```
Failed to initialize CoreCLR, HRESULT: 0x80004005
```

If I now run the same image with the `COMPlus_EnableDiagnostics` environment variable turned off:

```powershell
docker run --rm --read-only -it -p 8000:80 -e COMPlus_EnableDiagnostics=0 read-only-test
```

The app now starts! The `COMPlus_EnableDiagnostics` environment variable (which is [documented here](https://docs.microsoft.com/en-us/dotnet/core/run-time-config/debugging-profiling#enable-diagnostics)) turns off debugging and profiling support, so I would not bake this environment variable into the `Dockerfile`. For some reason these features need a read/write file system to work properly. If you'd like to try this yourself, you can checkout all the code in [this repo](https://github.com/RehanSaeed/ReadOnlyDockerTest).
