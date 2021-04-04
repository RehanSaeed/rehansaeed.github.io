---
title: "Optimally Configuring ASP.NET Core HttpClientFactory"
description: "How to optimally configure a HttpClient using the new HttpClientFactory API in ASP.NET Core 2.1 for best performance, usability, resiliency and easy of use."
author: "Muhammad Rehan Saeed"
permalink: "/optimally-configuring-asp-net-core-httpclientfactory/"
heroImage: "/images/hero/Microsoft-.NET-1366x768.png"
date: "2018-08-20"
dateModified: "2021-04-04"
published: true
categories:
    - "ASP.NET"
tags:
    - "ASP.NET Core"
    - "CorrelationId"
    - "HttpClient"
    - "HttpClientFactory"
    - "Polly"
---

::: warning Update (04 April 2021)
Updated all code for .NET 5 and mentioned Open Telemetry.
:::

::: warning Update (20 August 2018)
[Steve Gordon](https://www.stevejgordon.co.uk/) kindly suggested a [further optimisation](https://github.com/RehanSaeed/HttpClientSample/pull/1) to use `ConfigureHttpClient`. I've updated the code below to reflect this.
:::

In this post, I'm going to show how to optimally configure a `HttpClient` using the new [HttpClientFactory](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/http-requests?view=aspnetcore-2.1) API in ASP.NET Core 2.1. If you haven't already I recommend reading Steve Gordon's [series of blog posts](https://www.stevejgordon.co.uk/introduction-to-httpclientfactory-aspnetcore) on the subject since this post builds on that knowledge. You should also read his post about [Correlation ID's](https://www.stevejgordon.co.uk/asp-net-core-correlation-ids) as I'm making use of that library in this post. The main aims of the code in this post are to:

1. Use the `HttpClientFactory` typed client, I don't know why the ASP.NET team bothered to provide three ways to register a client, the typed client is the one to use. It provides type safety and removes the need for magic strings.
2. Enable GZIP decompression of responses for better performance. Interestingly, the `HttpClient` and ASP.NET Core does not support compression of GZIP requests, only responses. Doing some searching online some time ago suggests that this is an optimisation that is not very common at all, I thought this was pretty unbelievable at the time.
3. The `HttpClient` should time out after the server does not respond after a set amount of time.
4. The `HttpClient` should retry requests which fail due to transient errors.
5. The `HttpClient` should stop performing new requests for a period of time when a consecutive number of requests fail using the circuit breaker pattern. Failing fast in this way helps to protect an API or database that may be under high load and means the client gets a failed response quickly rather than waiting for a time-out.
6. The URL, time-out, retry and circuit breaker settings should be configurable from the `appsettings.json` file.
7. The `HttpClient` should send a `User-Agent` HTTP header telling the server the name and version of the calling application. If the server is logging this information, this can be useful for debugging purposes.
8. The `X-Correlation-ID` HTTP header from the response should be passed on to the request made using the `HttpClient`. This would make it easy to correlate a request across multiple applications.

# Usage Example

It doesn't really matter what the typed client `HttpClient` looks like, that's not what we're talking about but I include it for context.

```cs
public interface IRocketClient
{
    Task<TakeoffStatus> GetStatus(bool working);
}

public class RocketClient : IRocketClient
{
    private readonly HttpClient httpClient;

    public RocketClient(HttpClient httpClient) => this.httpClient = httpClient;

    public async Task<TakeoffStatus> GetStatus(bool working)
    {
        var response = await this.httpClient.GetAsync(working ? "status-working" : "status-failing");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<TakeoffStatus>();
    }
}
```

Here is how we register the typed client above with our dependency injection container. All of the meat lives in these three methods. `AddCorrelationId` adds a middleware written by Steve Gordon to handle [Correlation ID's](https://www.stevejgordon.co.uk/asp-net-core-correlation-ids). `AddPolicies` registers a policy registry and the policies themselves (A policy is [Polly's](https://github.com/App-vNext/Polly) way of specifying how you want to deal with errors e.g. using retries, circuit breaker pattern etc.). Finally, we add the typed `HttpClient` but with configuration options, so we can configure it's settings from `appsettings.json`.

```cs
public virtual void ConfigureServices(IServiceCollection services) =>
    services
        .AddDefaultCorrelationId() // Add Correlation ID support to ASP.NET Core
        .AddControllers()
        .Services
        .AddPolicies(this.configuration) // Setup Polly policies.
        .AddHttpClient<IRocketClient, RocketClient, RocketClientOptions>(this.configuration, "RocketClient")
        ...;
```

The `appsettings.json` file below contains the base address for the endpoint we want to connect to, a time-out value of thirty seconds is used if the server is taking too long to respond and policy settings for retries and the circuit breaker.

The retry settings state that after a first failed request, another three attempts will be made (this means you can get up to four requests). There will be an exponentially longer back-off or delay between each request. The first retry request will occur after two seconds, the second after another four seconds and the third occurs after another eight seconds.

The circuit breaker states that it will allow 12 consecutive failed requests before breaking the circuit and throwing `CircuitBrokenException` for every attempted request. The circuit will be broken for thirty seconds.

Generally, my advice is when allowing a high number of exceptions before breaking, use a longer duration of break. When allowing a lower number of exceptions before breaking, keep the duration of break small.

Another possibility I've not tried is to combine these two scenarios, so you have two circuit breakers. The circuit breaker with the lower limit would kick in first but only break the circuit for a short time, if exceptions are no longer thrown, then things go back to normal quickly. If exceptions continue to be thrown, then the other circuit breaker with a longer duration of break would kick in and the circuit would be broken for a longer period of time. I leave implementing this particular scenario to the reader.

You can of course play with these numbers, what you set them to will depend on your application.

```json
{
    "RocketClient": {
        "BaseAddress": "http://example.com",
        "Timeout": "00:00:30"
    },
    "Policies": {
        "HttpCircuitBreaker": {
            "DurationOfBreak": "00:00:30",
            "ExceptionsAllowedBeforeBreaking": 12
        },
        "HttpRetry": {
            "BackoffPower": 2,
            "Count": 3
        }
    }
}
```

# Configuring Polly Policies

Below is the implementation for `AddPollyPolicies`. It starts by setting up and reading a configuration section in our `appsettings.json` file of type `PolicyOptions`. Then adds the [PolicyRegistry](https://github.com/App-vNext/Polly/wiki/PolicyRegistry) which is where Polly stores it's policies. Finally, we add a retry and circuit breaker policy and configure them using the settings we've read from the `PolicyOptions`.

```cs
public static class ServiceCollectionExtensions
{
    private const string PoliciesConfigurationSectionName = "Policies";

    public static IServiceCollection AddPolicies(
        this IServiceCollection services,
        IConfiguration configuration,
        string configurationSectionName = PoliciesConfigurationSectionName)
    {
        services.Configure<PolicyOptions>(configuration);
        var policyOptions = configuration.GetSection(configurationSectionName).Get<PolicyOptions>();

        var policyRegistry = services.AddPolicyRegistry();
        policyRegistry.Add(
            PolicyName.HttpRetry,
            HttpPolicyExtensions
                .HandleTransientHttpError()
                .WaitAndRetryAsync(
                    policyOptions.HttpRetry.Count,
                    retryAttempt => TimeSpan.FromSeconds(Math.Pow(policyOptions.HttpRetry.BackoffPower, retryAttempt))));
        policyRegistry.Add(
            PolicyName.HttpCircuitBreaker,
            HttpPolicyExtensions
                .HandleTransientHttpError()
                .CircuitBreakerAsync(
                    handledEventsAllowedBeforeBreaking: policyOptions.HttpCircuitBreaker.ExceptionsAllowedBeforeBreaking,
                    durationOfBreak: policyOptions.HttpCircuitBreaker.DurationOfBreak));

        return services;
    }
}

public static class PolicyName
{
    public const string HttpCircuitBreaker = nameof(HttpCircuitBreaker);
    public const string HttpRetry = nameof(HttpRetry);
}

public class PolicyOptions
{
    public CircuitBreakerPolicyOptions HttpCircuitBreaker { get; set; }
    public RetryPolicyOptions HttpRetry { get; set; }
}

public class CircuitBreakerPolicyOptions
{
    public TimeSpan DurationOfBreak { get; set; } = TimeSpan.FromSeconds(30);
    public int ExceptionsAllowedBeforeBreaking { get; set; } = 12;
}

public class RetryPolicyOptions
{
    public int Count { get; set; } = 3;
    public int BackoffPower { get; set; } = 2;
}
```

Notice that each policy is using the `HandleTransientHttpError` method which tells Polly when to apply the retry and circuit breakers. One important question is, what is a transient HTTP error according to Polly? Well, looking at the [source code](https://github.com/App-vNext/Polly.Extensions.Http/blob/808665304882fb921b1c38cbbd38fcc102229f84/src/Polly.Extensions.Http.Shared/HttpPolicyExtensions.cs) in the `Polly.Extensions.Http` GitHub repository, it looks like they consider any of the below as transient errors:

1. Any `HttpRequestException` thrown. This can happen when the server is down.
2. A response with a status code of 408 Request Timeout.
3. A response with a status code of 500 or above.

# Configuring HttpClient

Finally, we can get down to configuring our `HttpClient` itself. The `AddHttpClient` method starts by binding the `TClientOptions` type to a configuration section in `appsettings.json`. `TClientOptions` is a derived type of `HttpClientOptions` which just contains a base address and time-out value. I'll come back to `CorrelationIdDelegatingHandler` and `UserAgentDelegatingHandler` in a moment.

We set the `HttpClientHandler` to be `DefaultHttpClientHandler`. This type just enables Brotli, GZIP and Deflate compression. Finally, we add the retry and circuit breaker policies to the `HttpClient`.

```cs
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddHttpClient<TClient, TImplementation, TClientOptions>(
        this IServiceCollection services,
        IConfiguration configuration,
        string configurationSectionName)
        where TClient : class
        where TImplementation : class, TClient
        where TClientOptions : HttpClientOptions, new() =>
        services
            .Configure<TClientOptions>(configuration.GetSection(configurationSectionName))
            .AddTransient<CorrelationIdDelegatingHandler>()
            .AddTransient<UserAgentDelegatingHandler>()
            .AddHttpClient<TClient, TImplementation>()
            .ConfigureHttpClient(
                (sp, options) =>
                {
                    var httpClientOptions = sp
                        .GetRequiredService<IOptions<TClientOptions>>()
                        .Value;
                    options.BaseAddress = httpClientOptions.BaseAddress;
                    options.Timeout = httpClientOptions.Timeout;
                })
            .ConfigurePrimaryHttpMessageHandler(x => new DefaultHttpClientHandler())
            .AddPolicyHandlerFromRegistry(PolicyName.HttpRetry)
            .AddPolicyHandlerFromRegistry(PolicyName.HttpCircuitBreaker)
            .AddHttpMessageHandler<CorrelationIdDelegatingHandler>()
            .AddHttpMessageHandler<UserAgentDelegatingHandler>()
            .Services;
}

public class DefaultHttpClientHandler : HttpClientHandler
{
    public DefaultHttpClientHandler() => this.AutomaticDecompression =
        DecompressionMethods.Deflate | DecompressionMethods.GZip | DecompressionMethods.Brotli;
}

public class HttpClientOptions
{
    public Uri BaseAddress { get; set; }

    public TimeSpan Timeout { get; set; }
}
```

# CorrelationIdDelegatingHandler

When I'm making a HTTP request from an API i.e. it's an API to API call and I control both sides, I use the `X-Correlation-ID` HTTP header to trace requests as they move down the stack. The `CorrelationIdDelegatingHandler` is used to take the correlation ID for the current HTTP request and pass it down to the request made in the API to API call. The implementation is pretty simple, it's just setting a HTTP header.

The power comes when you are using something like Application Insights, Kibana or Seq for logging. You can now take the correlation ID for a request and see the logs for it from multiple API's or services. This is really invaluable when you are dealing with a micro services architecture.

```cs
public class CorrelationIdDelegatingHandler : DelegatingHandler
{
    private readonly ICorrelationContextAccessor correlationContextAccessor;
    private readonly IOptions<CorrelationIdOptions> options;

    public CorrelationIdDelegatingHandler(
        ICorrelationContextAccessor correlationContextAccessor,
        IOptions<CorrelationIdOptions> options)
    {
        this.correlationContextAccessor = correlationContextAccessor;
        this.options = options;
    }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        if (!request.Headers.Contains(this.options.Value.RequestHeader))
        {
            request.Headers.Add(this.options.Value.RequestHeader, this.correlationContextAccessor.CorrelationContext.CorrelationId);
        }

        // Else the header has already been added due to a retry.

        return base.SendAsync(request, cancellationToken);
    }
}
```

# UserAgentDelegatingHandler

It's often useful to know something about the client that is calling your API for logging and debugging purposes. You can use the `User-Agent` HTTP header for this purpose.

The `UserAgentDelegatingHandler` just sets the `User-Agent` HTTP header by taking the API's assembly name and version attributes. You need to set the `Version` and `Product` attributes in your `csproj` file for this to work. The name and version are then placed along with the current operating system into the User-Agent string.

Now the next time you get an error in your API, you'll know the client application that caused it (if it's under your control).

```cs
public class UserAgentDelegatingHandler : DelegatingHandler
{
    public UserAgentDelegatingHandler()
        : this(Assembly.GetEntryAssembly())
    {
    }

    public UserAgentDelegatingHandler(Assembly assembly)
        : this(GetProduct(assembly), GetVersion(assembly))
    {
    }

    public UserAgentDelegatingHandler(string applicationName, string applicationVersion)
    {
        if (applicationName == null)
        {
            throw new ArgumentNullException(nameof(applicationName));
        }

        if (applicationVersion == null)
        {
            throw new ArgumentNullException(nameof(applicationVersion));
        }

        this.UserAgentValues = new List<ProductInfoHeaderValue>()
        {
            new ProductInfoHeaderValue(applicationName.Replace(' ', '-'), applicationVersion),
            new ProductInfoHeaderValue($"({Environment.OSVersion})"),
        };
    }

    public UserAgentDelegatingHandler(List<ProductInfoHeaderValue> userAgentValues) =>
        this.UserAgentValues = userAgentValues ?? throw new ArgumentNullException(nameof(userAgentValues));

    public List<ProductInfoHeaderValue> UserAgentValues { get; set; }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        if (!request.Headers.UserAgent.Any())
        {
            foreach (var userAgentValue in this.UserAgentValues)
            {
                request.Headers.UserAgent.Add(userAgentValue);
            }
        }

        // Else the header has already been added due to a retry.

        return base.SendAsync(request, cancellationToken);
    }

    private static string GetProduct(Assembly assembly) =>
        GetAttributeValue<AssemblyProductAttribute>(assembly);

    private static string GetVersion(Assembly assembly)
    {
        var infoVersion = GetAttributeValue<AssemblyInformationalVersionAttribute>(assembly);
        if (infoVersion != null)
        {
            return infoVersion;
        }

        return GetAttributeValue<AssemblyFileVersionAttribute>(assembly);
    }

    private static string GetAttributeValue<T>(Assembly assembly)
        where T : Attribute
    {
        var type = typeof(T);
        var attribute = assembly
            .CustomAttributes
            .Where(x => x.AttributeType == type)
            .Select(x => x.ConstructorArguments.FirstOrDefault())
            .FirstOrDefault();
        return attribute == null ? string.Empty : attribute.Value.ToString();
    }
}
```

```xml
<PropertyGroup Label="Package">
  <Version>1.0.0</Version>
  <Product>My Application</Product>
  <!-- ... -->
</PropertyGroup>
```

# Open Telemetry

Setting the `X-Correlation-ID` and `User-Agent` HTTP headers are useful things to do but there is a new set of HTTP headers which come under the Open Telemetry standard which not only replace them but also add additional functionality. You can read more about [Open Telemetry](https://rehansaeed.com/deep-dive-into-open-telemetry-for-net/) in my [series of blog posts](https://rehansaeed.com/deep-dive-into-open-telemetry-for-net/) on the subject.

# Sample GitHub Project

I realize that was a lot of boilerplate code to write. It was difficult to write this as more than one blog post. To aid in digestion, I've created a [GitHub sample project](https://github.com/RehanSaeed/HttpClientSample) with the full working code.

The sample project contains two API's. One makes a HTTP request to the other. You can pass a query argument to decide whether the callee API will fail or not and try out the retry and circuit breaker logic. Feel free to play with the configuration in `appsettings.json` and see what options work best for your application.
