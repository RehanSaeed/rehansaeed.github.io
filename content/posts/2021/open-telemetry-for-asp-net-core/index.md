---
title: "Open Telemetry for ASP.NET Core"
description: "The basics of how to configure Open Telemetry metrics, logs, and traces for ASP.NET Core and export the traces."
author: "Muhammad Rehan Saeed"
permalink: "/open-telemetry-for-asp-net-core/"
heroImage: "/images/hero/Open-Telemetry-1600x900.png"
date: "2021-02-01"
dateModified: null
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

1. [Open Telemetry - Deep Dive into Open Telemetry for .NET](/deep-dive-into-open-telemetry-for-net/)
2. [Open Telemetry - Configuring Open Telemetry for ASP.NET Core](/open-telemetry-for-asp-net-core/)
3. [Open Telemetry - Exporting Open Telemetry Data to Jaeger](/exporting-open-telemetry-data-to-jaeger/)
4. [Open Telemetry - Optimally Configuring Open Telemetry Tracing for ASP.NET Core](/optimally-configuring-open-telemetry-tracing-for-asp-net-core/)

Configuring Open Telemetry for ASP.NET Core is a fairly simple process. In this post, I'll show you the simplest setup for tracing Open Telemetry in ASP.NET Core and then move to a more fully featured example.

To begin with, we'll just be exporting our Open Telemetry traces to the debug output so we can see what is being recorded but we'll soon move on to exporting to Jaeger in another post where we can see nice visualisations of our traces.

# The Simplest Setup

Open Telemetry for ASP.NET Core ships as several NuGet packages. The `OpenTelemetry.Extensions.Hosting` package is the required core package to add Open Telemetry to your application.

You can optionally add packages beginning with `OpenTelemetry.Instrumentation.*` to collect extra span attributes e.g. the `OpenTelemetry.Instrumentation.AspNetCore` package adds span attributes for the current request and response.

You can also optionally add packages beginning with `OpenTelemetry.Exporter.*` to export trace data e.g. the `OpenTelemetry.Exporter.Console` package exports all trace data to the console or debug output of your application.

```xml
<ItemGroup Label="Package References">
  <PackageReference Include="OpenTelemetry.Exporter.Console" Version="1.0.1" />
  <PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.0.0-rc2" />
  <PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.0.0-rc2" />
</ItemGroup>
```

In our `Program.cs` I've added a `ConfigureServices` method, where we can add Open Telemetry support with just a few lines of code using the `AddOpenTelemetryTracing` method.

```cs
public virtual void ConfigureServices(
    IServiceCollection services,
    IWebHostEnvironment webHostEnvironment)
{
    // ...omitted
    services.AddOpenTelemetryTracing(
        builder =>
        {
            builder
                .SetResourceBuilder(ResourceBuilder
                    .CreateDefault()
                    .AddService(webHostEnvironment.ApplicationName))
                .AddAspNetCoreInstrumentation();
            if (webHostEnvironment.IsDevelopment())
            {
                builder.AddConsoleExporter(
                    options => options.Targets = ConsoleExporterOutputTargets.Debug);
            }
        });
}
```

The `SetResourceBuilder` method is your opportunity to add a set of common attributes to all spans created in the application. In the above case, we've added an application name.

The `AddAspNetCoreInstrumentation` method is where we enable collection of attributes relating to ASP.NET Core requests and responses.

Finally, we use `AddConsoleExporter` to export the trace data to the debug output. You could also output to the console but there is a lot of trace data and the console is already outputting log information which results in duplication, so I prefer not to do that. Note that we only do this if we are running in the development environment.

# The Trace Output

If we now start the application and execute a request/response cycle, we can see the following in our IDE's debug output window:

```
Activity.Id:          00-dde96d459fee4144a83818e054e221b1-cac69896c1bcd14f-01
Activity.DisplayName: /favicon-32x32.png
Activity.Kind:        Server
Activity.StartTime:   2021-02-01T10:28:25.4637044Z
Activity.Duration:    00:00:00.0086712
Activity.TagObjects:
    http.host: localhost:5001
    http.method: GET
    http.path: /favicon-32x32.png
    http.url: https://localhost:5001/favicon-32x32.png
    http.user_agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36
    http.status_code: 200
    otel.status_code: UNSET
    service.name: ApiTemplate
    service.instance.id: defe9269-04f2-4b49-a05c-ebddf2112993
    telemetry.sdk.name: opentelemetry
    telemetry.sdk.language: dotnet
    telemetry.sdk.version: 1.0.0.0
```

The first few lines give us some basic information about the span, including the span ID, start time and duration of the span. Under TagObjects is where we can see all attributes assigned to the span.

All attributes starting with `http` tell us about the request and response while the attributes starting with `service` tell us about the application itself. This includes a unique identifier for the current instance of the application. This can be useful if we were running multiple instances of the application in Kubernetes or Docker Swarm for example.

Finally, we also get quite a lot of information about the Open Telemetry library used to collect the information. It may eventually be useful when multiple versions of the Open Telemetry protocol are released and there is some feature difference between them but as of now, it's not very useful. I haven't been able to find a way to turn it off, since it's a fair amount of information to send in absolutely every trace message.

# Up Next

I've shown a basic example of setting up Open Telemetry and discussed the defaults of what trace data is collected in ASP.NET Core. In my next post, I'll cover how you can fire up Jaeger and show how you can get an ASP.NET Core app to export Open Telemetry data to it.
