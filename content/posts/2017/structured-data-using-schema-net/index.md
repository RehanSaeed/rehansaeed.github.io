---
title: "Structured Data using Schema.NET"
description: "Schema.NET is Schema.org objects turned into strongly typed C# POCO classes for use in .NET."
author: "Muhammad Rehan Saeed"
permalink: "/structured-data-using-schema-net/"
heroImage: "/images/hero/Schema.NET-1366x768.png"
date: "2017-07-02"
dateModified: null
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - ".NET Core"
  - "Bing"
  - "C#"
  - "Google"
  - "Schema.NET"
  - "Schema.org"
  - "Search Engines"
  - "Structured Data"
---

# What is Schema.org?

[Schema.org](https://schema.org) defines a set of standard classes and their properties for objects and services in the real world. There are nearly 700 classes at the time of writing defined by schema.org. This machine readable format is a common standard used across the web for describing things.

# Where is Schema.org Used?

### Websites

Websites can define Structured Data in the head section of their html to enable search engines to show richer information in their search results. Here is an example of how [Google](https://developers.google.com/search/docs/guides/intro-structured-data) can display extended metadata about your site in it's search results.

![Google Logo Structured Data Example](./images/Google-Logo-Structured-Data-Example.png)

Using structured data in html requires the use of a script tag with a MIME type of `application/ld+json` like so:

```html
<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "Organization",
  "url": "http://www.example.com",
  "name": "Unlimited Ball Bearings Corp.",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-401-555-1212",
    "contactType": "Customer service"
  }
}
</script>
```

### Windows UWP Sharing

Windows UWP apps let you share data using schema.org classes. [Here](https://docs.microsoft.com/en-us/uwp/schemas/appxpackage/appxmanifestschema/element-sharetarget) is an example showing how to share metadata about a book.

# Enter Schema.NET

Schema.NET is Schema.org objects turned into strongly typed C# POCO classes for use in .NET. All classes can be serialized into JSON/JSON-LD. Here is a simple Schema.NET example that defines the name and URL of a website:

```cs
var website = new WebSite()
{
    AlternateName = "An Alternative Name",
    Name = "Your Site Name",
    Url = new Uri("https://example.com")
};
var jsonLd = website.ToString();
```

The code above outputs the following JSON-LD:

```json
{
    "@context":"http://schema.org",
    "@type":"WebSite",
    "alternateName":"An Alternative Name",
    "name":"Your Site Name",
    "url":"https://example.com"
}
```

There are dozens more examples based on Google's Structured Data documentation with links to the relevant page in the unit tests of the Schema.NET project.

# Classes & Properties

schema.org defines classes and properties, where each property can have a single value or an array of multiple values. Additionally, properties can have multiple types e.g. an `Address` property could have a type of `string` or a type of `PostalAddress` which has it's own properties such as `StreetAddress` or `PostalCode` which breaks up an address into it's constituent parts.

To facilitate this Schema.NET uses some clever C# generics and implicit type conversions so that setting a single or multiple values is possible and that setting a `string` or `PostalAddress` is also possible:

```cs
// Single string address
var organization = new Organization()
{
    Address = "123 Old Kent Road E10 6RL"
};

// Multiple string addresses
var organization = new Organization()
{
    Address = new List<string>()
    { 
        "123 Old Kent Road E10 6RL",
        "456 Finsbury Park Road SW1 2JS"
    }
};

// Single PostalAddress address
var organization = new Organization()
{
    Address = new PostalAddress()
    {
        StreetAddress = "123 Old Kent Road",
        PostalCode = "E10 6RL"
    }
};

// Multiple PostalAddress addresses
var organization = new Organization()
{
    Address = new List<PostalAddress>()
    {
        new PostalAddress()
        {
            StreetAddress = "123 Old Kent Road",
            PostalCode = "E10 6RL"
        },
        new PostalAddress()
        {
            StreetAddress = "456 Finsbury Park Road",
            PostalCode = "SW1 2JS"
        }
    }
};
```

This magic is all carried out using the `Value<T>`, `Value<T1, T2>`, `Value<T1, T2, T3>` etc. types. These types are all `structs` for best performance too.

# Where to Get It?

Download the Schema.NET [NuGet package](https://www.nuget.org/packages/Schema.NET) or take a look at the code on [GitHub](https://github.com/RehanSaeed/Schema.NET). At some point I'll find the time to write a quick ASP.NET Core tag helper that wraps Schema.NET.
