---
title: "Optimally Configuring Open Telemetry for ASP.NET Core"
description: "How to optimally configure Open Telemetry metrics, logs, and traces for ASP.NET and display them in Jaeger."
author: "Muhammad Rehan Saeed"
permalink: "/optimally-configuring-open-telemetry-for-asp-net-core/"
heroImage: "/images/hero/Open-Telemetry-1600x900.png"
date: "2021-02-15"
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

https://github.blog/2021-05-26-why-and-how-github-is-adopting-opentelemetry/


Configuring Open Telemetry for ASP.NET Core is a fairly simple process. In this post, I'll show you the simplest setup for tracing Open Telemetry in ASP.NET Core and then move to a more fully featured example.

To begin with, we'll just be exporting our Open Telemetry traces to the debug output so we can see what is being recorded but we'll soon move on to exporting to Jaeger in another post where we can see nice visualisations of our traces.

# Simplest Setup

Open Telemetry for ASP.NET Core ships as several NuGet packages. The `OpenTelemetry.Extensions.Hosting` package is the required core package to add Open Telemetry to your application.

You can optionally add packages beginning with `OpenTelemetry.Instrumentation.*` to collect extra span attributes e.g. the `OpenTelemetry.Instrumentation.AspNetCore` package adds span attributes for the current request and response.

You can also optionally add packages beginning with `OpenTelemetry.Exporter.*` to export trace data e.g. the `OpenTelemetry.Exporter.Console` package exports all trace data to the console or debug output of your application.

```xml
<ItemGroup Label="Package References">
  <PackageReference Include="OpenTelemetry.Exporter.Console" Version="1.0.0-rc2" />
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

    // ...omitted
}
```

The `SetResourceBuilder` method is your opportunity to add a set of common attributes to all spans created in the application. In the above case, we've added an application name.

The `AddAspNetCoreInstrumentation` method is where we enable collection of attributes relating to ASP.NET Core requests and responses.

Finally, we use `AddConsoleExporter` to export the trace data to the debug output. You could also output to the console but there is a lot of trace data and the console is already outputting log information which results in duplication, so I prefer not to do that. Note that we only do this if we are running in the development environment.

If we now start the application and execute a request/response cycle, we can see the following in our IDE's debug output window:

```
[10:28:25 INF] HTTP GET /favicon-32x32.png responded 200 in 0.7371 ms
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
Resource associated with Activity:
    service.name: ApiTemplate
    service.instance.id: defe9269-04f2-4b49-a05c-ebddf2112993
    telemetry.sdk.name: opentelemetry
    telemetry.sdk.language: dotnet
    telemetry.sdk.version: 1.0.0.0
```

The first line of the debug output is actually from our log output (I had only enabled information level logs). The second line is where the Open Telemetry trace starts and is broken up into several sections. Most of the trace output is pretty self explanatory and describes the request/response pretty well, including the span ID, path, response status code, start time and duration of the span.

What I personally found surprising is the last section. In the last section we get the application name that we setup in the `SetResourceBuilder` call but we also get a unique identifier for the current instance of the application. This can be useful if we were running multiple instances of the application.

Finally, we also get quite a lot of information about the Open Telemetry library used to collect the information. It may eventually be useful when multiple versions of the Open Telemetry protocol are released and there is some feature difference between them but as of now, it's not very useful. I haven't been able to find a way to turn it off, since it's a fair amount of information to send in absolutely every trace message.





```cs
public virtual void ConfigureServices(IServiceCollection services) =>
    services
        // ...omitted
        .AddOpenTelemetryTracing(
            builder =>
            {
                builder
                    .AddAspNetCoreInstrumentation(
                        options =>
                        {
                            // Enrich spans with additional request and response meta data.
                            // See https://github.com/open-telemetry/opentelemetry-specification/blob/master/specification/trace/semantic_conventions/http.md
                            options.Enrich = (activity, eventName, obj) =>
                            {
                                if (obj is HttpRequest request)
                                {
                                    activity.AddTag("http.flavor", GetHttpFlavour(request.Protocol));
                                    activity.AddTag("http.scheme", request.Scheme);
                                    activity.AddTag("http.client_ip", request.Headers[ForwardedHeadersDefaults.XForwardedForHeaderName]);
                                    activity.AddTag("http.request_content_length", request.ContentLength);
                                    activity.AddTag("http.request_content_type", request.ContentType);
                                }
                                else if (obj is HttpResponse response)
                                {
                                    activity.AddTag("http.response_content_length", response.ContentLength);
                                    activity.AddTag("http.response_content_type", response.ContentType);
                                }

                                static string GetHttpFlavour(string protocol)
                                {
                                    if (HttpProtocol.IsHttp10(protocol))
                                    {
                                        return "1.0";
                                    }
                                    else if (HttpProtocol.IsHttp11(protocol))
                                    {
                                        return "1.1";
                                    }
                                    else if (HttpProtocol.IsHttp2(protocol))
                                    {
                                        return "2.0";
                                    }
                                    else if (HttpProtocol.IsHttp3(protocol))
                                    {
                                        return "3.0";
                                    }

                                    throw new InvalidOperationException($"Protocol {protocol} not recognised.");
                                }
                            };
                            options.RecordException = true;
                        });
                // TODO: Add OpenTelemetry.Instrumentation.* NuGet packages and configure them to collect more span data.
                //       E.g. add OpenTelemetry.Instrumentation.Http to instrument calls to HttpClient.
                // TODO: Add OpenTelemetry.Exporter.* NuGet packages and configure them here to export open telemetry span data.
                //       E.g. Add OpenTelemetry.Exporter.Jaeger to export span data to Jaeger.
            });
```



    <PackageReference Include="Serilog.Enrichers.Span" Version="1.0.1" Condition="'$(OpenTelemetry)' == 'true'" />




Changed default port for OTLP Exporter from 55680 to 4317


    55680 - OTLP receiver
    16686 - Dashboard
    13133 - Health Check

docker run --name jaeger -p 13133:13133 -p 16686:16686 -p 55680:55680 -d --restart=unless-stopped jaegertracing/opentelemetry-all-in-one



    <PackageReference Include="OpenTelemetry.Exporter.OpenTelemetryProtocol" Version="1.0.0-rc1.1" Condition="'$(OpenTelemetry)' == 'true'" />

                    builder.AddOtlpExporter(options => options.Endpoint = "localhost:55680");
