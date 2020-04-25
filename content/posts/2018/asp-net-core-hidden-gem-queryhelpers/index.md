---
title: "ASP.NET Core Hidden Gem - QueryHelpers"
description: "How to build a URL containing dynamic query arguments using the ASP.NET Core QueryHelpers.AddQueryString method. A hidden gem in ASP.NET Core."
author: "Muhammad Rehan Saeed"
permalink: "/asp-net-core-hidden-gem-queryhelpers/"
heroImage: "/images/hero/Microsoft-.NET-1366x768.png"
date: "2018-07-14"
dateModified: null
published: true
categories:
  - "ASP.NET"
tags:
  - "ASP.NET Core"
  - "C#"
  - "QueryHelpers"
  - "URL"
---

I discovered a hidden gem in ASP.NET Core a couple of weeks ago that can help to build up and parse URL's called `QueryHelpers`. Here's how you can use it to build a URL using the `AddQueryString`` method:

```cs
var queryArguments = new Dictionary<string, string>()
{
    { "static-argument", "foo" },
};

if (someFlagIsEnabled)
{
    queryArguments.Add("dynamic-argument", "bar");
}

string url = QueryHelpers.AddQueryString("/example/path", queryArguments);
```

Notice that there are no question marks or ampersands in sight. Where this really shines is when you want to add multiple arguments and then need to write code to work out whether to add a question mark or ampersand.

It's also worth noting that the values of the query arguments are URL encoded for you too. The type also has a `ParseQuery` method to parse query strings but that's less useful to us as ASP.NET Core controllers do that for you.

Finally, .NET also has a type called `UriBuilder` that you should know about. It's more geared towards building up a full URL, rather than a relative URL as I'm doing above. It has a `Query` property that you can use to set the query string but it's only of type string, so much less useful than `QueryHelpers.AddQueryString`.
