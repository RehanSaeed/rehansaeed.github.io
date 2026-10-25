---
title: "Open Telemetry for ASP.NET Core"
description: "The basics of how to configure Open Telemetry metrics, logs, and traces for ASP.NET Core and export the traces."
author: "Muhammad Rehan Saeed"
permalink: "/open-telemetry-for-asp-net-core/"
heroImage: "/images/hero/Open-Telemetry-1600x900.png"
date: "2021-02-01"
dateModified: "2026-10-25"
published: true
series: "Open Telemetry"
seriesOrder: 2
categories:
  - "ASP.NET"
tags:
  - "Open Telemetry"
  - ".NET"
  - ".NET Core"
  - "ASP.NET Core"
  - "Metrics"
  - "Logging"
  - "Tracing"
  - "Distributed Tracing"
  - "Span"
  - "Activity"
---

::: tip Update (2026-10-25)
Replaced the incomplete `ConfigureServices` example with a complete .NET 8 `Program.cs`, pinned the OpenTelemetry package versions and updated the trace output. Modern applications configure services through `builder.Services`; `AddOpenTelemetryTracing` was removed in OpenTelemetry 1.4.0.
:::

1. [Open Telemetry - Deep Dive into Open Telemetry for .NET](/deep-dive-into-open-telemetry-for-net/)
2. [Open Telemetry - Configuring Open Telemetry for ASP.NET Core](/open-telemetry-for-asp-net-core/)
3. [Open Telemetry - Exporting Open Telemetry Data to Jaeger](/exporting-open-telemetry-data-to-jaeger/)
4. [Open Telemetry - Optimally Configuring Open Telemetry Tracing for ASP.NET Core](/optimally-configuring-open-telemetry-tracing-for-asp-net-core/)

Configuring Open Telemetry for ASP.NET Core is a fairly simple process. In this post, I'll show you the simplest setup for tracing Open Telemetry in ASP.NET Core and then move to a more fully featured example.

To begin with, we'll just be exporting our Open Telemetry traces to the console so we can see what is being recorded. I'll cover exporting to Jaeger in another post where we can see nice visualisations of our traces.

# The Simplest Setup

Open Telemetry for ASP.NET Core ships as several NuGet packages. The `OpenTelemetry.Extensions.Hosting` package is the required core package to add Open Telemetry to your application.

You can optionally add packages beginning with `OpenTelemetry.Instrumentation.*` to collect extra span attributes e.g. the `OpenTelemetry.Instrumentation.AspNetCore` package adds span attributes for the current request and response.

You can also optionally add packages beginning with `OpenTelemetry.Exporter.*` to export trace data e.g. the `OpenTelemetry.Exporter.Console` package exports all trace data to the console or debug output of your application.

The following example targets **.NET 8** and uses **OpenTelemetry 1.20.0**. You'll need the .NET 8 SDK, or a newer SDK that supports targeting .NET 8, and the ASP.NET Core 8 runtime to run it. Create a new empty web application and install these specific package versions:

```powershell
dotnet new web --name OpenTelemetryExample --framework net8.0
cd OpenTelemetryExample
dotnet add package OpenTelemetry.Exporter.Console --version 1.20.0
dotnet add package OpenTelemetry.Extensions.Hosting --version 1.20.0
dotnet add package OpenTelemetry.Instrumentation.AspNetCore --version 1.20.0
```

Replace the entire contents of `Program.cs` with the following:

```cs
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(builder.Environment.ApplicationName))
    .WithTracing(tracing =>
    {
        tracing.AddAspNetCoreInstrumentation();

        if (builder.Environment.IsDevelopment())
        {
            tracing.AddConsoleExporter();
        }
    });

var app = builder.Build();

app.MapGet("/", () => "Hello, OpenTelemetry!");

app.Run();
```

There is no `ConfigureServices` method to add or call in this example. Modern ASP.NET Core templates use top-level statements in `Program.cs`, so I register services through `builder.Services` before calling `builder.Build()`. The original example omitted the enclosing class and hosting setup: pasting its `public virtual` method directly into `Program.cs` does not compile.

The OpenTelemetry registration API has also changed. `AddOpenTelemetryTracing` was [removed in OpenTelemetry 1.4.0](https://github.com/open-telemetry/opentelemetry-dotnet/blob/main/src/OpenTelemetry.Extensions.Hosting/CHANGELOG.md#140); the replacement is `AddOpenTelemetry().WithTracing(...)`, as shown in the [official ASP.NET Core getting-started guide](https://opentelemetry.io/docs/languages/dotnet/traces/getting-started-aspnetcore/).

The `ConfigureResource` method is your opportunity to add a set of common attributes to all spans created in the application. In the above case, we've added an application name.

The `AddAspNetCoreInstrumentation` method is where we enable collection of attributes relating to ASP.NET Core requests and responses.

Finally, we use `AddConsoleExporter` to export the trace data to the terminal. Note that we only do this if we are running in the development environment. If you prefer the IDE's debug output, use `tracing.AddConsoleExporter(options => options.Targets = OpenTelemetry.Exporter.ConsoleExporterOutputTargets.Debug)` instead. The console exporter is useful for local inspection; in production, configure an exporter for your telemetry backend.

Build and run the application with the development environment explicitly enabled. `--no-launch-profile` avoids relying on the template's launch settings:

```powershell
dotnet build
dotnet run --no-launch-profile -- --environment Development --urls http://localhost:5080
```

In another terminal, make a request:

```powershell
curl.exe http://localhost:5080/
```

The response should be `Hello, OpenTelemetry!`. Once the request completes, look in the application's terminal for the exported server span. Stop the application with `Ctrl+C`. If you run in a different environment, this example deliberately does not export traces to the console.

# The Trace Output

The console output includes fields like these. IDs, timestamps, ports and other attributes depend on the request and runtime:

```text
Activity.DisplayName:        GET /
Activity.Kind:               Server
Activity.Tags:
    server.address: localhost
    server.port: 5080
    http.request.method: GET
    url.scheme: http
    url.path: /
    network.protocol.version: 1.1
    http.route: /
    http.response.status_code: 200
Instrumentation scope (ActivitySource):
    Name: Microsoft.AspNetCore
Resource associated with Activity:
    service.name: OpenTelemetryExample
    telemetry.sdk.name: opentelemetry
    telemetry.sdk.language: dotnet
    telemetry.sdk.version: 1.20.0
```

The full output also includes the trace ID, span ID, start time and duration of the span. Under `Activity.Tags` we can see attributes assigned to the span.

The `http.*`, `url.*`, `server.*` and `network.*` attributes describe the request and response, while the resource's `service.*` attributes describe the application itself. The default resource also includes a unique `service.instance.id`, which can be useful if we are running multiple instances of the application in Kubernetes or Docker Swarm, for example. Older versions used different attribute names, such as `http.method` rather than `http.request.method`.

Finally, the resource includes information about the Open Telemetry SDK used to collect the data. `telemetry.sdk.version` identifies the SDK version, not the version of the Open Telemetry Protocol.

# Up Next

I've shown a basic example of setting up Open Telemetry and discussed the defaults of what trace data is collected in ASP.NET Core. In my next post, I'll cover how you can fire up Jaeger and show how you can get an ASP.NET Core app to export Open Telemetry data to it.
