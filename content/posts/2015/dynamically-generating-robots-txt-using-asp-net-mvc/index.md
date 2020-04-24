---
title: "Dynamically Generating Robots.txt Using ASP.NET MVC"
description: "How to dynamically generate a robots.txt file using a simple ASP.NET MVC action method and only a few lines of code."
author: "Muhammad Rehan Saeed"
permalink: "/dynamically-generating-robots-txt-using-asp-net-mvc/"
cover_image: "/images/hero/Robots.txt-1366x768.jpg"
date: "2015-07-31"
dateModified: null
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET MVC"
  - "ASP.NET Core Boilerplate"
  - "C#"
  - "Robots"
  - "Search Engine Optimization (SEO)"
  - "Search Engines"
  - "Web Crawlers"
---

- [ASP.NET Core Boilerplate](/asp-net-mvc-boilerplate/)
- Security
    - [Securing the ASP.NET MVC Web.config (Updated)](/securing-the-aspnet-mvc-web-config/)
    - [NWebSec ASP.NET MVC Security Through HTTP Headers](/nwebsec-asp-net-mvc-security-through-http-headers/)
    - [Content Security Policy (CSP) for ASP.NET MVC](/content-security-policy-for-asp-net-mvc/)
- Search Engine Optimization (SEO)
    - [Canonical URL's for ASP.NET MVC](/canonical-urls-for-asp-net-mvc/)
    - [Dynamically Generating Robots.txt Using ASP.NET MVC](/dynamically-generating-robots-txt-using-asp-net-mvc)
- [Internet Favicon Madness (Updated)](/internet-favicon-madness/)
- [Building RSS/Atom Feeds for ASP.NET MVC](/building-rssatom-feeds-for-asp-net-mvc/)

A `robots.txt` file is a simple text file you can place at the root of your site at `http://example.com/robots.txt` to tell search engine robots (also known as web crawlers) how to index your site. The robots know to look for this file at the root of every site before they start indexing the site. If you do not have this file in your site, you will be getting a lot of 404 Not Found errors in your logs.

The `robots.txt` uses the [Robots Exclusion Standard](http://en.wikipedia.org/wiki/Robots_exclusion_standard) which is a very simple format that can give robots instructions on what to index and what to skip. A very basic `robots.txt` file looks like this:

```
# Allow all robots to index this site.
user-agent: *

# Tell all robots not to index any of the pages under the /error path.
disallow: /error/

# Tell all robots to index the under the error/foo path.
allow: /error/foo/

# Add a link to the site-map. Unfortunately this must be an absolute URL.
sitemap: http://example.com/sitemap.xml
```

In the above code, all comments start with the hash character. It tells all robots that they can index everything on the site except pages under the `/error` path because we don't want our error pages showing up in peoples search results. The only exception to that rule is to allow the resources under the `/error/foo` path to be indexed.

The last line is interesting and tells robots where to find an XML file called a site-map. A site-map contains a list of URL's to all the pages in the site and is used to give search engines a list of URL's they can go through to index the entire site. It's a great SEO (Search Engine Optimization) technique to give your site a boost in it's search rankings.

I will discuss creating a dynamic `sitemap.xml` file for ASP.NET Core in a future post. For now, all you need to know is that the site-map URL has to be an absolute URL according to the specification. This is a pretty terrible decision by whoever created the robots exclusion standard. It's really annoying that when you're creating a site, you have to remember to manually update this URL. If the URL was relative we would not have this problem.

# Dynamically Generating a robots.txt File

Fortunately, it's really easy to dynamically create a `robots.txt` file, which auto-generates the site-map URL using the MVC `UrlHelper`. Take a look at the code below:

```cs
public class HomeController : Controller
{
    [Route("robots.txt", Name = "GetRobotsText"), OutputCache(Duration = 86400)]
    public ContentResult RobotsText()
    {
        StringBuilder stringBuilder = new StringBuilder();
        
        stringBuilder.AppendLine("user-agent: *");
        stringBuilder.AppendLine("disallow: /error/");
        stringBuilder.AppendLine("allow: /error/foo");
        stringBuilder.Append("sitemap: ");
        stringBuilder.AppendLine(this.Url.RouteUrl("GetSitemapXml", null, this.Request.Url.Scheme).TrimEnd('/'));
        
        return this.Content(stringBuilder.ToString(), "text/plain", Encoding.UTF8);
    }
    
    [Route("sitemap.xml", Name = "GetSitemapXml"), OutputCache(Duration = 86400)]
    public ContentResult SitemapXml()
    {
        // I'll talk about this in a later blog post.
    }
}
```

I set up a route to the `robots.txt` path at the root of the site in my main `HomeController` and cached the response for a day for better performance (You can and should probably specify a much longer period of time if you know yours won't change).

I then go on to append my commands to the StringBuilder. The great thing is that I can easily use the `UrlHelper` to generate a complete absolute URL to the sitemap.xml path which is also dynamically generated in much the same way. Finally, I just return the string as plain text using the UTF-8 encoding.

Creating a route ending with a file extension is not allowed by default in ASP.NET Core. To get around this security restriction, you need to add the following to the `Web.config` file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <!-- ...Omitted -->
  <system.webServer>
    <!-- ...Omitted -->
    <handlers>
      <!-- ...Omitted -->
      <add name="RobotsText" 
           path="robots.txt" 
           verb="GET" 
           type="System.Web.Handlers.TransferRequestHandler" 
           preCondition="integratedMode,runtimeVersionv4.0" />
    </handlers>
  </system.webServer>
</configuration>
```

# Conclusion

Dynamically generating your `robots.txt` file is pretty easy and only takes as many lines of code as you need to write your `robots.txt` file anyway. It also means that you don't need to pollute your project structure with yet another file at the root of it (This problem is fixed in MVC Core, where all static files must be added to the wwwroot folder). You can also dynamically generate your site-map URL so you don't need to remember to update it every time you change the domain.

You could argue that performance is an issue when compared to a static robots.txt text file but its a matter of a few bytes and if you cache the response with a sufficient time limit then I think that even that problem goes away.

Once again, you can find a working example of this and much more using the [ASP.NET Core Boilerplate](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) project template.
