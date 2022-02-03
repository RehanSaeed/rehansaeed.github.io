---
title: "Optimally Configuring Open Telemetry Tracing for ASP.NET Core"
description: "How to optimally configure Open Telemetry traces for ASP.NET Core enriched with lots of extra information."
author: "Muhammad Rehan Saeed"
permalink: "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/"
heroImage: "/images/hero/Open-Telemetry-1600x900.png"
date: "2022-02-03"
dateModified: null
published: true
series: "Open Telemetry"
seriesOrder: 4
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

Configuring tracing in Open Telemetry for ASP.NET Core can be a fairly simple process but never accept the defaults! There is always more we can do to make improvements.

In this post, I'll show you how you can take the simplest setup for Open Telemetry tracing I showed you in ['Configuring Open Telemetry for ASP.NET Core'](/open-telemetry-for-asp-net-core/) and move to a more fully featured example.

# Simplest Setup

Here is a reminder of the simple setup I showed you in ['Configuring Open Telemetry for ASP.NET Core'](/open-telemetry-for-asp-net-core/):

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

And the tracing output you can expect for a request/response cycle:

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

# The Kitchen Sink Setup

This time we're going to setup a more advanced configuration. We're going to start off by adding a lot more information to our `ResourceBuilder` we pass to the `SetResourceBuilder` function above.

```cs
private static ResourceBuilder GetResourceBuilder(IWebHostEnvironment webHostEnvironment)
{
    var version = Assembly
        .GetExecutingAssembly()
        .GetCustomAttribute<AssemblyFileVersionAttribute>()!
        .Version
    ResourceBuilder
        .CreateEmpty()
        .AddService(webHostEnvironment.ApplicationName, serviceVersion: version)
        .AddAttributes(
            new KeyValuePair<string, object>[]
            {
                new("deployment.environment", webHostEnvironment.EnvironmentName),
                new("host.name", Environment.MachineName),
            })
        .AddEnvironmentVariableDetector();
}
```

This time we want to start with an empty resource builder calling `CreateEmpty`. We then add the application name and version which we can retrieve from the current assembly. You may have multiple versions of your application running over time and its important to have a way to differentiate between them.

We then add a few attributes to every span including the environment name and machine name. The attribute names here are [standardised](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/trace/semantic_conventions/README.md) as defined by the Open Telemetry specification. I decided that knowing the environment the application is running in and the machine name is important to know when troubleshooting issues.

Finally, we add an environment variable detector which we can use to add further attributes to every span using environment variables. Using `ResourceBuilder.CreateDefault` already included this in the simple example above but since we started with an empty resource builder we need to add it explicitly. Here is a PowerShell example of how you can add add additional attributes to every span using the `OTEL_RESOURCE_ATTRIBUTES` environment variable:

```powershell
$env:OTEL_RESOURCE_ATTRIBUTES = 'key1=value1,key2=value2'
```

We can now plug the `GetResourceBuilder` into our code below and add a few more goodies:

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
                .SetResourceBuilder(GetResourceBuilder(webHostEnvironment))
                .AddAspNetCoreInstrumentation(
                    options =>
                    {
                        options.Enrich = Enrich;
                        options.RecordException = true;
                    });
            if (webHostEnvironment.IsDevelopment())
            {
                builder.AddConsoleExporter(
                    options => options.Targets = ConsoleExporterOutputTargets.Debug);
            }
        });
}

private static void Enrich(Activity activity, string eventName, object obj)
{
    if (obj is HttpRequest request)
    {
        var context = request.HttpContext;
        activity.AddTag("http.flavor", GetHttpFlavour(request.Protocol));
        activity.AddTag("http.scheme", request.Scheme);
        activity.AddTag("http.client_ip", context.Connection.RemoteIpAddress);
        activity.AddTag("http.request_content_length", request.ContentLength);
        activity.AddTag("http.request_content_type", request.ContentType);

        var user = context.User;
        if (user.Identity?.Name is not null)
        {
            activity.AddTag("enduser.id", user.Identity.Name);
            activity.AddTag(
                "enduser.scope",
                string.Join(',', user.Claims.Select(x => x.Value)));
        }
    }
    else if (obj is HttpResponse response)
    {
        activity.AddTag("http.response_content_length", response.ContentLength);
        activity.AddTag("http.response_content_type", response.ContentType);
    }
}

public static string GetHttpFlavour(string protocol)
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
```

Next, we configure `AddAspNetCoreInstrumentation` to enrich the spans with additional information about the current request, response and the user (if any) using standardised attributes. Finally, we record details of exceptions from our controllers which would otherwise be lost. This outputs the following:

```
Activity.Id:          00-3d0f70e71a8e6e5e87f156bdcf94b8c9-ccdd8d23a2e3ba93-01
Activity.ActivitySourceName: OpenTelemetry.Instrumentation.AspNetCore
Activity.DisplayName: /favicon-32x32.png
Activity.Kind:        Server
Activity.StartTime:   2022-02-03T10:52:47.6513334Z
Activity.Duration:    00:00:00.0077181
Activity.TagObjects:
    http.host: localhost:5001
    http.method: GET
    http.target: /favicon-32x32.png
    http.url: https://localhost:5001/favicon-32x32.png
    http.user_agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36
    http.flavor: 2.0
    http.scheme: https
    http.client_ip: ::1
    http.request_content_length:
    http.request_content_type:
    http.status_code: 200
    otel.status_code: UNSET
    http.response_content_length: 628
    http.response_content_type: image/png
    deployment.environment: Development
    host.name: REHANS-MACHINE
    service.name: ApiTemplate
    service.version: 5.1.1.0
    service.instance.id: 4e364d08-4965-4d83-8afa-70769074ab0d
```

This time around you can see we've collected a lot more information. Now, this may not be 'optimal' for your application. Collecting additional information comes at a performance and monetary cost, so its up to you to judge what extra information is useful to you but I think most of the above is pretty essential basic information that would be valuable while debugging any issues.

# Wrapping Up

In this post, I showed a simple example showing how you can configure Open Telemetry tracing and then went on to show a more advanced real world example.

Open Telemetry is gaining popularity and traction with even [GitHub adopting it](https://github.blog/2021-05-26-why-and-how-github-is-adopting-opentelemetry/). So far in this blog series we've only discussed the basics of Open Telemetry and tracing in particular. When Open Telemetry metrics and logs comes out of alpha/beta, I'll write another post discussing configuring those.
