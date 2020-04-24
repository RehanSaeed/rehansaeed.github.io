---
title: "Dynamically Generating Sitemap.xml for ASP.NET MVC"
description: "How to dynamically generate a sitemap.xml file using ASP.NET MVC to improve the Search Engine Optimization (SEO) of your site and get better search rankings."
author: "Muhammad Rehan Saeed"
permalink: "/dynamically-generating-sitemap-xml-for-asp-net-mvc/"
heroImage: "/images/hero/Sitemaps-1366x768.png"
date: "2015-09-15"
dateModified: null
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET MVC"
  - "ASP.NET Core Boilerplate"
  - "Search Engine Optimization (SEO)"
  - "Sitemap"
---

# What is a sitemap.xml File

The official [sitemaps.org](http://www.sitemaps.org/) site says it best:

> Sitemaps are an easy way for webmasters to inform search engines about pages on their sites that are available for crawling. In its simplest form, a Sitemap is an XML file that lists URL's for a site along with additional metadata about each URL (when it was last updated, how often it usually changes, and how important it is, relative to other URL's in the site) so that search engines can more intelligently crawl the site.
> 
> Web crawlers usually discover pages from links within the site and from other sites. Sitemaps supplement this data to allow crawlers that support Sitemaps to pick up all URL's in the Sitemap and learn about those URL's using the associated metadata. Using the Sitemap protocol does not guarantee that web pages are included in search engines, but provides hints for web crawlers to do a better job of crawling your site.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
   <url>
      <loc>http://www.example.com/</loc>
      <lastmod>2005-01-01</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
   </url>
   <!-- ... -->
</urlset>
```

As you can see each URL in a sitemap contains four pieces of metadata:

- **url** - The URL itself.
- **lastmod** (Optional) - A last modified timestamp. This tells search engines whether or not they should re-index the page to reflect any changes that have been made.
- **changefreq** (Optional) - A change frequency indicator (This can take the values: always, hourly, daily, weekly, monthly, yearly, never). This gives search engines an indication of how often they should come back and re-index the page.
- **priority** (Optional) - A number from zero to one indicating the importance of the page compared to other pages on the site.

The latter three values only give search engines an indication of when they can or should index or even re-index a page. It is not a guarantee that it will happen, although it makes it more likely.

# Is it Worth the Effort?

Search engines are black boxes. We only know what goes into them (Our sitemap) and what comes out the other end (The search results). I can make no promises that adding a sitemap will increase your sites search rankings but **Google** [says](https://support.google.com/webmasters/answer/156184?hl=en):

> Using a sitemap doesn't guarantee that all the items in your sitemap will be crawled and indexed, as Google processes rely on complex algorithms to schedule crawling. However, **in most cases, your site will benefit from having a sitemap**, and you'll never be penalized for having one.

# Generating a Static sitemap.xml File

There are tools online you can use to generate a static sitemap.xml file, which you can dump at the root of your site but you have to manually update these every time your site changes. This may be fine if your site does not change much but adding a dynamically generated sitemap.xml file is fairly simple process and worth the effort.

# Dynamically Generating Sitemap.xml for ASP.NET MVC

Dynamically generating a simple sitemap.xml file for ASP.NET MVC is really simple but adding all the bells and whistles requires a bit more work. We start with a SitemapNode and frequency enumeration which represents a single URL in our sitemap:

```cs
public class SitemapNode
{
    public SitemapFrequency? Frequency { get; set; }
    public DateTime? LastModified { get; set; }
    public double? Priority { get; set; }
    public string Url { get; set; }
}

public enum SitemapFrequency
{
    Never,
    Yearly,
    Monthly,
    Weekly,
    Daily,
    Hourly,
    Always
}
```

Now we need to create a collection of `SitemapNode`'s. In my example below, I add the three main pages of my site, Home, About and Contact. I then go on to add a collection of product pages. I am getting every product ID from my database and using that to generate a product URL. Note that I'm not using every property on the `SitemapNode` class since in my case I don't have an easy way to figure out a last changed date but I do specify a priority and frequency for my products.

Please note that the URL's must be absolute and I am using an extension method I wrote called `AbsoluteRouteUrl` to generate absolute URL's instead of relative ones. I have included that below too.

```cs
public IReadOnlyCollection<SitemapNode> GetSitemapNodes(UrlHelper urlHelper)
{
    List<SitemapNode> nodes = new List<SitemapNode>();

    nodes.Add(
        new SitemapNode()
        {
            Url = urlHelper.AbsoluteRouteUrl("HomeGetIndex"),
            Priority = 1
        });
    nodes.Add(
       new SitemapNode()
       {
           Url = urlHelper.AbsoluteRouteUrl("HomeGetAbout"),
           Priority = 0.9
       });
    nodes.Add(
       new SitemapNode()
       {
           Url = urlHelper.AbsoluteRouteUrl("HomeGetContact"),
           Priority = 0.9
       });

    foreach (int productId in productRepository.GetProductIds())
    {
        nodes.Add(
           new SitemapNode()
           {
               Url = urlHelper.AbsoluteRouteUrl("ProductGetProduct", new { id = productId }),
               Frequency = SitemapFrequency.Weekly,
               Priority = 0.8
           });
    }

    return nodes;
}

public class UrlHelperExtensions
{
    public static string AbsoluteRouteUrl(
        this UrlHelper urlHelper,
        string routeName,
        object routeValues = null)
    {
        string scheme = urlHelper.RequestContext.HttpContext.Request.Url.Scheme;
        return urlHelper.RouteUrl(routeName, routeValues, scheme);
    }
}
```

Now all we have to do is turn our collection of `SitemapNode`'s into XML:

```cs
public string GetSitemapDocument(IEnumerable<SitemapNode> sitemapNodes)
{
    XNamespace xmlns = "http://www.sitemaps.org/schemas/sitemap/0.9";
    XElement root = new XElement(xmlns + "urlset");

    foreach (SitemapNode sitemapNode in sitemapNodes)
    {
        XElement urlElement = new XElement(
            xmlns + "url",
            new XElement(xmlns + "loc", Uri.EscapeUriString(sitemapNode.Url)),
            sitemapNode.LastModified == null ? null : new XElement(
                xmlns + "lastmod", 
                sitemapNode.LastModified.Value.ToLocalTime().ToString("yyyy-MM-ddTHH:mm:sszzz")),
            sitemapNode.Frequency == null ? null : new XElement(
                xmlns + "changefreq", 
                sitemapNode.Frequency.Value.ToString().ToLowerInvariant()),
            sitemapNode.Priority == null ? null : new XElement(
                xmlns + "priority", 
                sitemapNode.Priority.Value.ToString("F1", CultureInfo.InvariantCulture)));
        root.Add(urlElement);
    }

    XDocument document = new XDocument(root);
    return document.ToString();
}
```

Now we add an action method to our `HomeController` to get to our sitemap. Note the route to get to the sitemap. It is [recommended](http://www.sitemaps.org/faq.html) to place your sitemap at the root of your site at `sitemap.xml`. Also note that creating a route with a file extension at the end (`.xml`) is not allowed in MVC 5 and below (ASP.NET Core is fine), so you need to add the line below in your `Web.config` file.

```cs
[RoutePrefix("")]
public class HomeController : Controller
{
    [Route("sitemap.xml")]
    public ActionResult SitemapXml()
    {
        var sitemapNodes = GetSitemapNodes(this.Url);
        string xml = GetSitemapDocument(sitemapNodes);
        return this.Content(xml, ContentType.Xml, Encoding.UTF8);
    }
}
```

```xml
<configuration>
  <system.webServer>
    <handlers>
      <add name="SitemapXml" path="sitemap.xml" verb="GET" type="System.Web.Handlers.TransferRequestHandler" preCondition="integratedMode,runtimeVersionv4.0" />
    </handlers>
  </system.webServer>
</configuration>
```

# Sitemap Index Files

For most people the above code will be enough. You can only have a maximum of 50,000 URL's in your sitemap and it must not exceed 10MB in size. I did some testing and if your URL's are fairly long and you supply all of the metadata for each URL, you can easily hit the 10MB mark with 25,000 URL's.

It's not clear what happens if search engines come across a file that breaches these limits. I would have thought that the likes of Google or Bing would have a margin of error but it's better to be well under the limits than over. Not many sites have that many pages but you'd be surprised at how easy it is to hit these limits.

This is where sitemap index files come in. The idea is that you break up your sitemap into pages and list all of these in an index file. When a search engine visits your sitemap.xml file, they retrieve the index file and visit each page in turn. Here is an example of an index file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
   <sitemap>
      <loc>http://www.example.com/sitemap1.xml</loc>
      <lastmod>2004-10-01T18:23:17+00:00</lastmod>
   </sitemap>
   <sitemap>
      <loc>http://www.example.com/sitemap2.xml.gz</loc>
      <lastmod>2005-01-01</lastmod>
   </sitemap>
</sitemapindex>
```

As you can see you can optionally add a last modified date to each sitemap URL to tell search engines when a sitemap file has changed. This last modified date can be calculated from it's contents, you just need to take the latest last modified date from that particular page.

This blog post has started to get a little long and I haven't even covered sitemap pinging yet, so I will not go into too much detail but I will refer you to where you can get at the full source code and worked example. Luckily, all of the code above and the code to generate a sitemap index file is available here:

- ASP.NET Core Boilerplate Framework NuGet packages for [MVC 5](https://www.nuget.org/packages/Boilerplate.Web.Mvc5/) and [ASP.NET Core](https://www.nuget.org/packages/Boilerplate.Web.Mvc6/).
- You can also generate a project using the [ASP.NET Core Boilerplate](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) project template to see the full code in action.

# Conclusions

Adding a sitemap is a great Search Engine Optimization (SEO) technique to improve your sites search rankings. With my NuGet package, it makes it a really simple feature to add to your site. In my next blog post, I'll talk about sitemap pinging which can be used to pro-actively notify search engines of a change in your sitemap.
