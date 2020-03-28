---
title: "SEO Friendly URL's for ASP.NET Core"
description: "An SEO friendly URL is human readable and gives your site a higher page rank. Learn how to implement SEO friendly URL's using ASP.NET Core."
author: "Muhammad Rehan Saeed"
permalink: "/seo-friendly-urls-asp-net-core/"
cover_image: "./images/Search-Engine-Optimization-SEO.png"
date: "2016-12-17"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET Core"
  - "ASP.NET MVC"
  - ".NET Boxed"
  - "Friendly URL"
  - "Search Engine Optimization (SEO)"
---

For some reason there are not a lot of Search Engine Optimization (SEO) blog posts or projects out there. Taking a few simple steps can make your site rank higher in Google or Bing search results so it's well worth doing. Here are a few other of my SEO related blog posts:

- [Canonical URL's for ASP.NET MVC](/canonical-urls-for-asp-net-mvc/)
- [Dynamically Generating Sitemap.xml for ASP.NET MVC](/dynamically-generating-sitemap-xml-for-asp-net-mvc/)
- [Dynamically Generating Robots.txt Using ASP.NET MVC](/dynamically-generating-robots-txt-using-asp-net-mvc/)

# What is an SEO Friendly URL?

This Mozilla blog post called '[15 best practices for structuring URL's'](https://moz.com/blog/15-seo-best-practices-for-structuring-urls) is the best article on the subject of SEO friendly URL's I found and it's well worth a read.

Essentially you want a simple short URL that tells the user what they are clicking on at a glance. It should also contain keywords pertaining to what is on the page for better Search Engine Optimization (SEO). In short, a page will appear higher up in search results if the term a user searches for appears in the URL. Your URL should look like this:

![SEO Friendly URL Example](./images/SEO-Friendly-URL.png)

The URL contains an ID for a product and ends with a friendly title. The title contains alphanumeric characters with dashes instead of spaces. Note that the ID of the product is still included in the URL, to avoid having to deal with two friendly titles with the same name.

If you elect to omit the ID, then you have to do a lot of footwork to make things work. Firstly, you have to use the title as a kind of primary key to get the product data from your database and secondly, you also have to figure out what to do when there are two pages with the same title. Each time you want to create a new title, you have to scan your data store to see if the title already exists and if it does either error and force the creation of a different title or add make it unique by adding a number on the end. This is a lot of work but does produce a nicer URL, the choice is yours.

# How to Build One

Take a look at the controller action below. It is a very simple example of how to use SEO friendly URL's. In our example we have a product class which has a ID and title properties, where the title is just the name of the product.

```cs
[HttpGet("product/{id}/{title}", Name = "GetProduct")]
public IActionResult GetProduct(int id, string title)
{
    // Get the product as indicated by the ID from a database or some repository.
    var product = this.productRepository.Find(id);

    // If a product with the specified ID was not found, return a 404 Not Found response.
    if (product == null)
    {
        return this.NotFound();
    }

    // Get the actual friendly version of the title.
    string friendlyTitle = FriendlyUrlHelper.GetFriendlyTitle(product.Title);

    // Compare the title with the friendly title.
    if (!string.Equals(friendlyTitle, title, StringComparison.Ordinal))
    {
        // If the title is null, empty or does not match the friendly title, return a 301 Permanent
        // Redirect to the correct friendly URL.
        return this.RedirectToRoutePermanent("GetProduct", new { id = id, title = friendlyTitle });
    }

    // The URL the client has browsed to is correct, show them the view containing the product.
    return this.View(product);
}
```

All the work is done by the `FriendlyUrlHelper` which turns the product title which may contain spaces, numbers or other special characters (which would not be allowed in a URL without escaping them) into a `lower-kebab-case` title.

This generated friendly title is compared with the one that is passed in and if it is different (Someone may have omitted the friendly title or mis-spelled it) we perform a permanent redirect to the product with the same ID but now with the friendly title. This is important for SEO purposes, we want search engines to only find one URL for each product. Finally, if the friendly title matches the one passed in we return the product view.

# The FriendlyUrlHelper

The `FriendlyUrlHelper` was inspired by a famous StackOverflow question '[How does Stack Overflow generate its SEO-friendly URLs?](https://stackoverflow.com/questions/25259/how-does-stack-overflow-generate-its-seo-friendly-urls/25486)'. The full source code for it is shown below.

```cs
/// <summary>
/// Helps convert <see cref="string"/> title text to URL friendly <see cref="string"/>'s that can safely be
/// displayed in a URL.
/// </summary>
public static class FriendlyUrlHelper
{
    /// <summary>
    /// Converts the specified title so that it is more human and search engine readable e.g.
    /// http://example.com/product/123/this-is-the-seo-and-human-friendly-product-title. Note that the ID of the
    /// product is still included in the URL, to avoid having to deal with two titles with the same name. Search
    /// Engine Optimization (SEO) friendly URL's gives your site a boost in search rankings by including keywords
    /// in your URL's. They are also easier to read by users and can give them an indication of what they are
    /// clicking on when they look at a URL. Refer to the code example below to see how this helper can be used.
    /// Go to definition on this method to see a code example. To learn more about friendly URL's see
    /// https://moz.com/blog/15-seo-best-practices-for-structuring-urls.
    /// To learn more about how this was implemented see
    /// http://stackoverflow.com/questions/25259/how-does-stack-overflow-generate-its-seo-friendly-urls/25486#25486
    /// </summary>
    /// <param name="title">The title of the URL.</param>
    /// <param name="remapToAscii">if set to <c>true</c>, remaps special UTF8 characters like 'è' to their ASCII
    /// equivalent 'e'. All modern browsers except Internet Explorer display the 'è' correctly. Older browsers and
    /// Internet Explorer percent encode these international characters so they are displayed as'%C3%A8'. What you
    /// set this to depends on whether your target users are English speakers or not.</param>
    /// <param name="maxlength">The maximum allowed length of the title.</param>
    /// <returns>The SEO and human friendly title.</returns>
    /// <code>
    /// [HttpGet("product/{id}/{title}", Name = "GetDetails")]
    /// public IActionResult Product(int id, string title)
    /// {
    ///     // Get the product as indicated by the ID from a database or some repository.
    ///     var product = ProductRepository.Find(id);
    ///
    ///     // If a product with the specified ID was not found, return a 404 Not Found response.
    ///     if (product == null)
    ///     {
    ///         return this.HttpNotFound();
    ///     }
    ///
    ///     // Get the actual friendly version of the title.
    ///     var friendlyTitle = FriendlyUrlHelper.GetFriendlyTitle(product.Title);
    ///
    ///     // Compare the title with the friendly title.
    ///     if (!string.Equals(friendlyTitle, title, StringComparison.Ordinal))
    ///     {
    ///         // If the title is null, empty or does not match the friendly title, return a 301 Permanent
    ///         // Redirect to the correct friendly URL.
    ///         return this.RedirectToRoutePermanent("GetProduct", new { id = id, title = friendlyTitle });
    ///     }
    ///
    ///     // The URL the client has browsed to is correct, show them the view containing the product.
    ///     return this.View(product);
    /// }
    /// </code>
    public static string GetFriendlyTitle(string title, bool remapToAscii = false, int maxlength = 80)
    {
        if (title == null)
        {
            return string.Empty;
        }

        int length = title.Length;
        bool prevdash = false;
        StringBuilder stringBuilder = new StringBuilder(length);
        char c;

        for (int i = 0; i < length; ++i)
        {
            c = title[i];
            if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9'))
            {
                stringBuilder.Append(c);
                prevdash = false;
            }
            else if (c >= 'A' && c <= 'Z')
            {
                // tricky way to convert to lower-case
                stringBuilder.Append((char)(c | 32));
                prevdash = false;
            }
            else if ((c == ' ') || (c == ',') || (c == '.') || (c == '/') ||
                (c == '\\') || (c == '-') || (c == '_') || (c == '='))
            {
                if (!prevdash && (stringBuilder.Length > 0))
                {
                    stringBuilder.Append('-');
                    prevdash = true;
                }
            }
            else if (c >= 128)
            {
                int previousLength = stringBuilder.Length;

                if (remapToAscii)
                {
                    stringBuilder.Append(RemapInternationalCharToAscii(c));
                }
                else
                {
                    stringBuilder.Append(c);
                }

                if (previousLength != stringBuilder.Length)
                {
                    prevdash = false;
                }
            }

            if (i == maxlength)
            {
                break;
            }
        }

        if (prevdash)
        {
            return stringBuilder.ToString().Substring(0, stringBuilder.Length - 1);
        }
        else
        {
            return stringBuilder.ToString();
        }
    }

    /// <summary>
    /// Remaps the international character to their equivalent ASCII characters. See
    /// http://meta.stackexchange.com/questions/7435/non-us-ascii-characters-dropped-from-full-profile-url/7696#7696
    /// </summary>
    /// <param name="character">The character to remap to its ASCII equivalent.</param>
    /// <returns>The remapped character</returns>
    private static string RemapInternationalCharToAscii(char character)
    {
        string s = character.ToString().ToLowerInvariant();
        if ("àåáâäãåąā".Contains(s))
        {
            return "a";
        }
        else if ("èéêëę".Contains(s))
        {
            return "e";
        }
        else if ("ìíîïı".Contains(s))
        {
            return "i";
        }
        else if ("òóôõöøőð".Contains(s))
        {
            return "o";
        }
        else if ("ùúûüŭů".Contains(s))
        {
            return "u";
        }
        else if ("çćčĉ".Contains(s))
        {
            return "c";
        }
        else if ("żźž".Contains(s))
        {
            return "z";
        }
        else if ("śşšŝ".Contains(s))
        {
            return "s";
        }
        else if ("ñń".Contains(s))
        {
            return "n";
        }
        else if ("ýÿ".Contains(s))
        {
            return "y";
        }
        else if ("ğĝ".Contains(s))
        {
            return "g";
        }
        else if (character == 'ř')
        {
            return "r";
        }
        else if (character == 'ł')
        {
            return "l";
        }
        else if (character == 'đ')
        {
            return "d";
        }
        else if (character == 'ß')
        {
            return "ss";
        }
        else if (character == 'Þ')
        {
            return "th";
        }
        else if (character == 'ĥ')
        {
            return "h";
        }
        else if (character == 'ĵ')
        {
            return "j";
        }
        else
        {
            return string.Empty;
        }
    }
}
```

The difference between my version and the one in the StackOverflow answer is that mine optionally handles non-ASCII characters using the boolean remapToAscii parameter. This parameter remaps special UTF8 characters like `è` to their ASCII equivalent `e`. If there is no equivalent, then those characters are dropped. All modern browsers except Internet Explorer and Edge display the `è` correctly. Older browsers like Internet Explorer percent encode these international characters so they are displayed as `%C3%A8`. What you set this to depends on whether your target users are English speakers and if you care about supporting IE and Edge. I must say that I was hoping Edge would have added support so that `remapToAscii` could be turned off by default but I'm sorely disappointed.

Using the third parameter you can specify a maximum length for the title with any additional characters being dropped. Finally, the last thing to say about this method is that it has been tuned for speed.

# Where Can I Get It?

This is a great little snippet of code to make your URL's a human readable, while giving your site an SEO boost. It doesn't take much effort to use either. This helper class is available in the [Boxed.AspNetCore](https://www.nuget.org/packages/Boxed.AspNetCore) NuGet package or you can look at the source code in the [.NET Boxed Framework](https://github.com/Dotnet-Boxed/Framework) GitHub page.
