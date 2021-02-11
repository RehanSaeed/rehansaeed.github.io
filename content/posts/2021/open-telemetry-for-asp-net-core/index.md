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
4. Open Telemetry - Optimally Configuring Open Telemetry for ASP.NET Core

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

In our `Startup` class's `ConfigureServices` method, we can add Open Telemetry support with just a few lines of code using the `AddOpenTelemetryTracing` method.

```cs
public class Startup
{
    private readonly IWebHostEnvironment webHostEnvironment;

    public Startup(IWebHostEnvironment webHostEnvironment) =>
        this.webHostEnvironment = webHostEnvironment;

    public virtual void ConfigureServices(IServiceCollection services)
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
                    builder.AddConsoleExporter(options => options.Targets = ConsoleExporterOutputTargets.Debug);
                }
            });
    }

    public virtual void Configure(IApplicationBuilder application)
    {
        // ...omitted
    }
}
```

The `SetResourceBuilder` method is your opportunity to add a set of common attributes to all spans created in the application. In the above case, we've added an application name.

The `AddAspNetCoreInstrumentation` method is where we enable collection of attributes relating to ASP.NET Core requests and responses.

Finally, we use `AddConsoleExporter` to export the trace data to the debug output. You could also output to the console but there is a lot of trace data and the console is already outputting log information which results in duplication, so I prefer not to do that. Note that we only do this if we are running in the development environment.

# The Trace Output

If we now start the application and execute a request/response cycle, we can see the following in our IDE's debug output window:

```
[09:14:35 INF] HTTP GET /favicon-32x32.png responded 200 in 0.7606 ms
Activity.Id:          00-674c4d4b579bc64baa18b3bcd86c2de4-9d35fca101782841-01
Activity.DisplayName: /favicon-32x32.png
Activity.Kind:        Server
Activity.StartTime:   2021-02-11T09:14:35.0633272Z
Activity.Duration:    00:00:00.0113650
Activity.TagObjects:
    http.host: localhost:5001
    http.method: GET
    http.path: /favicon-32x32.png
    http.url: https://localhost:5001/favicon-32x32.png
    http.user_agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36
    http.status_code: 200
    otel.status_code: UNSET
Resource associated with Activity:
    service.name: ApiTemplate
    service.instance.id: dd70a756-4347-4794-aed5-0a5e94bca423
```

The first line of the debug output is actually from our log output (I had only enabled information level logs). The second line is where the Open Telemetry trace starts and is broken up into several sections. Most of the trace output is pretty self explanatory and describes the request/response pretty well, including the span ID, path, response status code, start time and duration of the span.

What I personally found surprising is the last section. In the last section we get the application name that we setup in the `SetResourceBuilder` call but we also get a unique identifier for the current instance of the application. This can be useful if we were running multiple instances of the application in Kubernetes or Docker Swarm for example.

# Up Next

I've shown a basic example of setting up Open Telemetry and discussed the defaults of what trace data is collected in ASP.NET Core. In my next post, I'll cover how you can fire up Jaeger and show how you can get an ASP.NET Core app to export Open Telemetry data to it.
