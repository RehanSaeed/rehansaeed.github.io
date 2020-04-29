---
title: "ASP.NET Core Caching in Practice"
description: "How to use and implement Cache-Control, Cache-Control Immutable, E-Tag, Last-Modified and If-Modified-Since Caching HTTP headers in ASP.NET Core."
author: "Muhammad Rehan Saeed"
permalink: "/asp-net-core-caching-in-practice/"
heroImage: "/images/hero/ASP.NET-Core-Caching-in-Practice-1366x768.png"
date: "2017-10-20"
dateModified: null
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - ".NET Core"
  - "ASP.NET Core"
  - "ASP.NET MVC"
  - "C#"
  - "Cache-Control"
  - "Caching"
  - "E-Tag"
  - "If-Modified-Since"
---

# Cache-Control HTTP Header

The [Cache-Control](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching) HTTP header can be used to set how long your resource can be cached for. However, the problem with this HTTP header is that you need to be able to predict the future and know before hand when the cache will become invalid. For some use cases, like writing an API where someone could change the resource at any time that's just not feasible.

I recommend you read the response caching middleware [documentation](https://docs.microsoft.com/en-us/aspnet/core/performance/caching/middleware), it's not necessary as I do a quick overview next but the knowledge below builds upon it. The simple way to set the cache control header is directly on the action method like so:

```cs
[HttpGet, ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
public IActionResult GetCats()
```

Adding the `ResponseCache` attribute just adds the `Cache-Control` HTTP header but does not actually cache the response on the server. To do that you also need to add the response caching middleware like so:

```cs
public void Configure(IApplicationBuilder application) =>
    application.UseResponseCaching().UseMvc();
```

Instead of hard coding all of your cache settings in the `ResponseCache` attribute, it's possible to store them in the `appsettings.json` configuration file. To do so, you need to use a feature called cache profiles which look like this:

```cs
[HttpGet, ResponseCache(CacheProfile="Cache1Hour")]
public IActionResult GetCats()

public class Startup
{    
    private readonly IConfiguration configuration;
    
    public Startup() => this.configuration = configuration;

    public void ConfigureServices(IServiceCollection services) =>
        services
            .Configure<Dictionary<string, CacheProfile>>(configuration.GetSection("CacheProfiles"))
            .AddMvc(options =>
            {
                // Read cache profiles from appsettings.json configuration file
                var cacheProfiles = this.configuration.GetSection<Dictionary<string, CacheProfile>>();
                foreach (var keyValuePair in cacheProfiles)
                {
                    options.CacheProfiles.Add(keyValuePair);
                }
            });
            
    // Omitted
}
```

```json
{
  "CacheProfiles": {
    "Cache1Hour": {
      "Duration": 3600,
     "Location": "Any"
    }
  },
  // Omitted...
}
```

Now all your caching can be configured from a single configuration file.

## Cache-Control Immutable Directive

`Cache-Control` also has a new draft directive called `immutable`. When you add this to the HTTP header value, you are basically telling the client that this resource never changes even if it has expired. You might be asking, why do we need this? Well, it turns out that when you refresh a page in a browser, it goes off to the server and checks to see if the resource has expired or not.

```http
Cache-Control: max-age=365000000, immutable
```

It turns out that you get a massive reduction in requests to your server by implementing this directive. Read more about it in these links:

- [IETF Draft Spec](https://tools.ietf.org/html/draft-mcmanus-immutable-00)
- [Using Immutable Caching To Speed Up The Web](https://hacks.mozilla.org/2017/01/using-immutable-caching-to-speed-up-the-web/)
- [Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Cache-Control: immutable](https://bitsup.blogspot.co.uk/2016/05/cache-control-immutable.html)
- [This browser tweak saved 60% of requests to Facebook](https://code.facebook.com/posts/557147474482256)

This directive has not yet been implemented in ASP.NET Core but I've raised an issue on GitHub [here](https://github.com/aspnet/HttpAbstractions/issues/763) and there is also another issue [here](https://github.com/aspnet/ResponseCaching/issues/97) to add the immutable directive to the static files middleware. If you really wanted to, it's really easy to add this directive today, as you just need to append the word `immutable` onto the end of your `Cache-Control` HTTP header.

A word of warning! You need to make sure that your resource really never changes. You can do this in Razor by using the `asp-append-version` attribute on your script tags:

```html
<script src="~/site.js" asp-append-version="true"></script>
```

This will append a query string to the link to site.js which will contain a hash of the contents of the file. Each time the file changes, the hash is changed and thus you can safely mark the resource as immutable.

# E-Tags

[E-tags](https://en.wikipedia.org/wiki/HTTP_ETag) are typically generated in three ways (Read the link to understand what they are):

1. Hashing the HTTP response body - You'd want to use a very fast and collision resistant hash function like MD5 (MD5 is broken security wise and you should never use it but it's ok to use it for caching). Unfortunately, this method is slow because you have to load the entire response body into memory (which is not the default in ASP.NET Core which streams it straight to the client for better performance) to hash it. If you're still interested in implementing this `E-Tag`'s using this method [Mads Kristensen](https://madskristensen.net/post/send-etag-headers-in-aspnet-core) wrote a nice blog post showing how it can be done.
2. Last modification timestamp - The `E-Tag` can literally be the time the object was last modified which you can store in your database (I usually store created and modified timestamps for anything I store in a database anyway). This solves the performance problem above but now what is the difference between doing this and using the Last Modified HTTP header?
3. Revision Number - This could be some kind of integer stored in the database which gets incremented each time the data is modified. I don't see any advantage of doing this over using the last modification timestamp above, unless you have a naturally occurring revision number in your data that you could use.

One additional thing you need to be careful of is the `Accept`, `Accept-Encoding` and `Accept-Language` HTTP headers. Any time you send a different response based on these HTTP headers, your `E-Tag` needs to be different e.g. a JSON non-gzip'ed response in Mandarin needs to have a different `E-Tag` to an XML gzip'ed response in Urdu.

For option one, this can be achieved by calculating the hash after the response body has gone through GZIP compression. For the second and third options, you would need to append the value of the Accept HTTP headers to the last modified date or revision number and then hash all of that.

# Last-Modified & If-Modified-Since

I'm assuming you already know about the [Last-Modified](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified) and [If-Modified-Since](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since) HTTP headers. If not, go ahead and read the links. Below is an example controller and action method that returns a list of cats.

```cs
[Route("[controller]")]
public class CatsController : ControllerBase
{
    private readonly ICatRepository catRepository;
    private readonly ICatMapper catMapper;

    public CatsController(
        ICatRepository catRepository,
        ICatMapper catMapper)
    {
        this.catRepository = catRepository;
        this.catMapper = catMapper;
    }

    [HttpGet("")]
    public async Task<IActionResult> GetCats(CancellationToken cancellationToken)
    {
        var cats = await this.catRepository.GetAll(cancellationToken);
        var lastModified = cats.Count == 0 ? 
            (DateTimeOffset?)null : 
            cats.Max(x => x.ModifiedTimestamp);

        this.Response.GetTypedHeaders().LastModified = lastModified;

        var requestHeaders = this.Request.GetTypedHeaders();
        if (requestHeaders.IfModifiedSince.HasValue &&
            requestHeaders.IfModifiedSince.Value >= lastModified)
        {
            return this.StatusCode(StatusCodes.Status304NotModified);
        }

        var catViewModels = this.catMapper.MapList(cats);
        return this.Ok(catViewModels);
    }
}
```

All of our cats have a ModifiedTimestamp, so we know when they were last changed. There are four scenarios that this action method handles:

1. Our repository does not contain any cats, so just always return an empty list.
2. No `Last-Modified` HTTP header exists in the request, so we just return all cats.
3. `Last-Modified` HTTP header exists and cats have been modified since that date, so return all cats.
4. `Last-Modified` HTTP header exists but no cats have been modified since that date, so return a 304 Not Modified response.

In all cases, except when we have no cats at all, we set the `Last-Modified` date to the latest date than any cat has been modified.

# Conclusions

Which caching HTTP headers you pick, depends on your data but at a minimum, I would add `E-Tag`'s or `Last-Modified`. Add `Cache-Control` where possible, usually for static assets.
