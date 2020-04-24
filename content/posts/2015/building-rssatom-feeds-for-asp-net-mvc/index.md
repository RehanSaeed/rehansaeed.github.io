---
title: "Building RSS/Atom Feeds for ASP.NET MVC"
description: "How to build a fully featured RSS/Atom feed for ASP.NET MVC, including Google's PubSubHubbub and the 'Subscribe to this feed' button."
author: "Muhammad Rehan Saeed"
permalink: "/building-rssatom-feeds-for-asp-net-mvc/"
cover_image: "/images/hero/RSS-And-Atom-1366x768.png"
date: "2015-06-26"
dateModified: null
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET MVC"
  - "ASP.NET Core Boilerplate"
  - "Atom"
  - "C#"
  - "RSS"
  - "SyndicationFeed"
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

# What is an RSS/Atom Feed

An [RSS](https://en.wikipedia.org/wiki/RSS) or [Atom](https://en.wikipedia.org/wiki/Atom_%28standard%29) feed is a great way to push site updates to users. Essentially, it's just an XML document which is constantly updated with fresh content and links.

There are numerous feed readers out there that all work in different ways but most just aggregate feeds from several sites into a single reading list. When a user subscribes to your sites feed and adds it to their list of subscriptions, each time you update your feed the fresh content will appear in their reading list.

Feed readers come in all shapes and sizes, even browsers have basic feed reading abilities. Here is a screen-shot of Firefox's bookmarks side-bar, after adding the [Visual Studio Magazine](https://visualstudiomagazine.com/rss-feeds/blogs.aspx) feed (Go ahead and try it yourself in Firefox). The bookmarks under the Blogs folder updates each time the feed updates.

![Firefox Live Bookmarks Feed](./images/Firefox-Live-Bookmarks-Feed.png)

Feed reading websites like [Feedly](http://feedly.com/i/welcome) and [NewsBlur](http://www.newsblur.com/) are fairly popular. Increasingly though, feed readers are actually just apps running on phones or tablets and these can even raise notifications when the feed changes and there is fresh content to read. Services like Feedly and NewsBlur also have their own apps too.

# RSS vs Atom

The latest versions of RSS is 2.0, while Atom is 1.0. Atom 1.0 is a web standard and you can read the official IETF Atom 1.0 specification [here](www.ietf.org/rfc/rfc4287.txt). RSS is not a web standard and is actually owned by Harvard University.

Atom was created specifically to address problems in RSS 2.0 and is the newer and more well defined format. Both of these formats are now pretty ancient by web standards and enjoy widespread support. If you have a choice of format, go with Atom 1.0.

# Atom 1.0 XML

So what does an Atom feed look like, well you can look at the official specification [here](https://tools.ietf.org/html/rfc4287) or there is a simple but fully featured example below.

```xml
<?xml version="1.0" encoding="utf-8"?>
<feed xml:lang="en-GB" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
  <title type="text">ASP.NET Core Boilerplate</title>
  <subtitle type="text">This is the ASP.NET Core Boilerplate feed description.</subtitle>
  <id>3D797739-1DED-4DB8-B60B-1CA52D0AA1A4</id>
  <rights type="text">© 2015 - Rehan Saeed</rights>
  <updated>2015-06-24T15:54:21+01:00</updated>
  <category term="Blog" />
  <logo>http://example.com/icons/atom-logo-96x48.png</logo>
  <author>
    <name>Rehan Saeed</name>
    <uri>https://rehansaeed.com</uri>
    <email>example@email.com</email>
  </author>
  <contributor>
    <name>Rehan Saeed</name>
    <uri>https://rehansaeed.com</uri>
    <email>example@email.com</email>
  </contributor>
  <link rel="self" type="application/atom+xml" href="http://example.com/feed/" />
  <link rel="alternate" type="text/html" href="http://example.com/" />
  <link rel="hub" href="https://pubsubhubbub.appspot.com/" />
  <icon>http://example.com/icons/atom-icon-48x48.png</icon>
  <entry>
    <id>6139F098-2E59-4405-9BC7-0AAB4CF78E23</id>
    <title type="text">Item 1</title>
    <summary type="text">A summary of item 1</summary>
    <published>2015-06-24T15:54:21+01:00</published>
    <updated>2015-06-24T15:54:21+01:00</updated>
    <author>
      <name>Rehan Saeed</name>
      <uri>https://rehansaeed.com</uri>
      <email>example@email.com</email>
    </author>
    <contributor>
      <name>Rehan Saeed</name>
      <uri>https://rehansaeed.com</uri>
      <email>example@email.com</email>
    </contributor>
    <link rel="alternate" type="text/html" href="http://example.com/item1/" />
    <link rel="enclosure" type="image/png" href="http://example.com/item1/atom-icon-48x48.png" />
    <category term="Category 1" />
    <rights type="text">© 2015 - Rehan Saeed</rights>
    <media:thumbnail url="http://example.com/item1/atom-icon-48x48.png" width="48" height="48" />
  </entry>
  <entry>
    <id>927406DD-E8DC-41ED-8154-30DE91B0877A</id>
    <title type="text">Item 2</title>
    <summary type="text">A summary of item 2</summary>
    <published>2015-06-24T15:54:21+01:00</published>
    <updated>2015-06-24T15:54:21+01:00</updated>
    <author>
      <name>Rehan Saeed</name>
      <uri>https://rehansaeed.com</uri>
      <email>example@email.com</email>
    </author>
    <contributor>
      <name>Rehan Saeed</name>
      <uri>https://rehansaeed.com</uri>
      <email>example@email.com</email>
    </contributor>
    <link rel="alternate" type="text/html" href="http://example.com/item2/" />
    <link rel="enclosure" type="image/png" href="http://example.com/item2/atom-icon-48x48.png" />
    <category term="Category 2" />
    <rights type="text">© 2015 - Rehan Saeed</rights>
    <media:thumbnail url="http://example.com/item2/atom-icon-48x48.png" width="48" height="48" />
  </entry>
</feed>
```

At the root of the XML we have the feed element which represents the Atom Feed. Within that, there is various meta-data about the feed at the top, including:

- title - The title of the feed.
- subtitle - A short description or subtitle of the feed.
- id - A unique ID for the feed. No other feed on the internet should have the same ID.
- rights - Copyright information.
- updated - When the feed was last updated.
- category - Zero or more categories the feed belongs to.
- logo - A wide 2:1 ratio image representing the feed.
- author - Zero or more authors of the feed.
- contributor - Zero or more contributors of the feed.
- link rel="self" - A link to the feed itself.
- link rel="alternate" - A link to an alternative representation of the feed.
- link rel="hub" - A link to the [PubSubHubbub](https://pubsubhubbub.googlecode.com/git/pubsubhubbub-core-0.4.html) hub. I'll talk more about this further on.
- icon - A square 1:1 ratio image representing the feed.

The entry elements are where it gets interesting, these are the actual 'things' in your feed you are describing. Each entry has meta-data which looks very similar to the meta-data we used to describe the feed itself.

- id - A unique identifier to the entry. This can be a database row ID, it doesn't have to be a GUID.
- title - The title of the entry.
- summary - A short summary for what the entry is about.
- published - When the entry was published.
- updated - When the entry was last changed.
- author - Zero or more authors of the entry.
- contributor- Zero or more contributors of the entry.
- link rel="alternate" - A link to an alternative representation of the entry.
- link rel="enclosure" - An image representing the entry.
- category - The category of the entry.
- rights - Some copyright information.
- media:thumbnail - A thumbnail representing the entry. This is a non-standard extension to the Atom 1.0 specification created by Yahoo but is common enough to be used here.

One thing to note is that all of the links are full absolute URL's. Relative URL's are allowed but you have to specify a single base URI which is added to the start of all URL's. Unfortunately, this feature is [buggy](https://bugzilla.mozilla.org/show_bug.cgi?id=480600) in Firefox and so should not be used.

# Implementing an Atom Feed

The [Windows Communication Foundation (WCF)](https://msdn.microsoft.com/en-us/library/ms731082%28v=vs.110%29.aspx?f=255&MSPPError=-2147217396) team at Microsoft has kindly implemented the [SyndicationFeed](https://msdn.microsoft.com/en-us/library/system.servicemodel.syndication.syndicationfeed%28v=vs.110%29.aspx) class, giving us a nice API with which to generate the above Atom 1.0 XML (In actual fact this class also represents an RSS 2.0 feed and can be used to generate RSS 2.0 XML too). Since it was the WCF team at Microsoft who built it, they put it in the `System.ServiceModel` namespace. It doesn't quite feel right there and will probably be split out into it's own namespace (Indeed, I've raised [this](https://github.com/dotnet/wcf/issues/76) very question for the new [DNX Core](http://docs.asp.net/en/latest/dnx/overview.html) version of the .NET Framework which is currently missing SyndicationFeed). Creating a new feed is as simple as this:

```cs
SyndicationFeed feed = new SyndicationFeed()
{
    // id (Required) - The feed universally unique identifier.
    Id = "3D797739-1DED-4DB8-B60B-1CA52D0AA1A4",
    // title (Required) - Contains a human readable title for the feed. Often the same as the title of the 
    //                    associated website. This value should not be blank.
    Title = SyndicationContent.CreatePlaintextContent("ASP.NET Core Boilerplate"),
    // items (Required) - The entries to add to the feed. I'll cover how to do this further on.
    Items = this.GetItems(),
    // subtitle (Recommended) - Contains a human-readable description or subtitle for the feed.
    Description = SyndicationContent.CreatePlaintextContent(
        "This is the ASP.NET Core Boilerplate feed description."),
    // updated (Optional) - Indicates the last time the feed was modified in a significant way.
    LastUpdatedTime = DateTimeOffset.Now,
    // logo (Optional) - Identifies a larger image which provides visual identification for the feed. 
    //                   Images should be twice as wide as they are tall.
    ImageUrl = new Uri("http://example.com/icons/atom-logo-96x48.png"),
    // rights (Optional) - Conveys information about rights, e.g. copyrights, held in and over the feed.
    Copyright = SyndicationContent.CreatePlaintextContent(
        string.Format("© {0} - {1}", DateTime.Now.Year, "Rehan Saeed")),
    // lang (Optional) - The language of the feed.
    Language = "en-GB",
    // generator (Optional) - Identifies the software used to generate the feed, for debugging and other 
    //                        purposes. Do not put in anything that identifies the technology you are using.
    // Generator = "Sample Code",
    // base (Buggy) - Add the full base URL to the site so that all other links can be relative. This is 
    //                great, except some feed readers are buggy with it, INCLUDING FIREFOX!!! 
    //                (See https://bugzilla.mozilla.org/show_bug.cgi?id=480600).
    // BaseUri = new Uri("http://example.com")
};

// self link (Required) - The URL for the syndication feed.
feed.Links.Add(SyndicationLink.CreateSelfLink(
    new Uri("http://example.com/feed/"), 
    ContentType.Atom));

// alternate link (Recommended) - The URL for the web page showing the same data as the syndication feed.
feed.Links.Add(SyndicationLink.CreateAlternateLink(
    new Uri("http://example.com"), 
    ContentType.Html));

// hub link (Recommended) - The URL for the PubSubHubbub hub. Used to push new entries to subscribers 
//                          instead of making them poll the feed. See feed updated method below.
feed.Links.Add(new SyndicationLink(new Uri("https://pubsubhubbub.appspot.com/"), "hub", null, null, 0));

// author (Recommended) - Names one author of the feed. A feed may have multiple author elements. A feed 
//                        must contain at least one author element unless all of the entry elements contain 
//                        at least one author element.
feed.Authors.Add(
    new SyndicationPerson()
    {
        // name (Required) - conveys a human-readable name for the person.
        Name = "Rehan Saeed",
        // uri (Optional) - contains a home page for the person.
        Uri = "https://rehansaeed.com",
        // email (Optional) - contains an email address for the person.
        Email = "example@email.com"
    });

// category (Optional) - Specifies a category that the feed belongs to. A feed may have multiple category 
//                       elements.
feed.Categories.Add(new SyndicationCategory("CategoryName"));

// contributor (Optional) - Names one contributor to the feed. An feed may have multiple contributor 
//                          elements.
feed.Contributors.Add(
    new SyndicationPerson()
    {
        Name = "Rehan Saeed",
        Uri = "https://rehansaeed.com",
        Email = "example@email.com"
    });

// icon (Optional) - Identifies a small image which provides iconic visual identification for the feed. 
//                   Icons should be square.
feed.SetIcon(this.urlHelper.AbsoluteContent("http://example.com/icons/atom-icon-48x48.png"));

// Add the Yahoo Media namespace (xmlns:media="http://search.yahoo.com/mrss/") to the Atom feed. 
// This gives us extra abilities, like the ability to give thumbnail images to entries. 
// See http://www.rssboard.org/media-rss for more information.
feed.AddYahooMediaNamespace();
```

Unfortunately, the property to set the icon does not exist on the `SyndicationFeed`, even though it is part of the official specification. Luckily for you I have created a quick extension method (Usage shown above) which allows us to set the icon.

I've also created an extension method to add a Yahoo media thumbnail to an Atom entry. This is a non-standard extension but worth the effort. To use non-standard extensions, requires adding a namespace to the feed element in the XML, that is what the `AddYahooMediaNamespace` method does towards the bottom.

The extension methods are shown below. They use extensibility points on the `SyndicationFeed`, that allows us to augment its functionality.

```cs
/// <summary>
/// <see cref="SyndicationFeed"/> extension methods.
/// </summary>
public static class SyndicationFeedExtensions
{
    private const string YahooMediaNamespacePrefix = "media";
    private const string YahooMediaNamespace = "http://search.yahoo.com/mrss/";

    /// <summary>
    /// Adds a namespace to the specified feed.
    /// </summary>
    /// <param name="feed">The syndication feed.</param>
    /// <param name="namespacePrefix">The namespace prefix.</param>
    /// <param name="xmlNamespace">The XML namespace.</param>
    public static void AddNamespace(this SyndicationFeed feed, string namespacePrefix, string xmlNamespace)
    {
        feed.AttributeExtensions.Add(
            new XmlQualifiedName(namespacePrefix, XNamespace.Xmlns.ToString()), 
            xmlNamespace);
    }

    /// <summary>
    /// Adds the yahoo media namespace to the specified feed.
    /// </summary>
    /// <param name="feed">The syndication feed.</param>
    public static void AddYahooMediaNamespace(this SyndicationFeed feed)
    {
        AddNamespace(feed, YahooMediaNamespacePrefix, YahooMediaNamespace);
    }

    /// <summary>
    /// Gets the icon URL for the feed.
    /// </summary>
    /// <param name="feed">The syndication feed.</param>
    /// <returns>The icon URL.</returns>
    public static string GetIcon(this SyndicationFeed feed)
    {
        SyndicationElementExtension iconExtension = feed.ElementExtensions.FirstOrDefault(
            x => string.Equals(x.OuterName, "icon", StringComparison.OrdinalIgnoreCase));
        return iconExtension.GetObject<string>();
    }

    /// <summary>
    /// Sets the icon URL for the feed.
    /// </summary>
    /// <param name="feed">The syndication feed.</param>
    /// <param name="iconUrl">The icon URL.</param>
    public static void SetIcon(this SyndicationFeed feed, string iconUrl)
    {
        feed.ElementExtensions.Add(new SyndicationElementExtension("icon", null, iconUrl));
    }

    /// <summary>
    /// Sets the Yahoo Media thumbnail for the feed entry.
    /// </summary>
    /// <param name="item">The feed entry.</param>
    /// <param name="url">The thumbnail URL.</param>
    /// <param name="width">The optional width of the thumbnail image.</param>
    /// <param name="height">The optional height of the thumbnail image.</param>
    public static void SetThumbnail(this SyndicationItem item, string url, int? width, int? height)
    {
        XNamespace ns = YahooMediaNamespace;
        item.ElementExtensions.Add(new SyndicationElementExtension(
            new XElement(
                ns + "thumbnail",
                new XAttribute("url", url),
                width.HasValue ? new XAttribute("width", width) : null,
                height.HasValue ? new XAttribute("height", height) : null)));
    }
}
```

Creating feed entries is just as simple and is done using the [SyndicationItem](https://msdn.microsoft.com/en-us/library/system.servicemodel.syndication.syndicationitem%28v=vs.110%29.aspx) class. An example of creating the first entry is shown below.

```cs
SyndicationItem item = new SyndicationItem()
{
    // id (Required) - Identifies the entry using a universally unique and permanent URI. Two entries 
    //                 in a feed can have the same value for id if they represent the same entry at 
    //                 different points in time.
    Id = "6139F098-2E59-4405-9BC7-0AAB4CF78E23",
    // title (Required) - Contains a human readable title for the entry. This value should not be blank.
    Title = SyndicationContent.CreatePlaintextContent("Item 1"),
    // description (Recommended) - A summary of the entry.
    Summary = SyndicationContent.CreatePlaintextContent("A summary of item 1"),
    // updated (Optional) - Indicates the last time the entry was modified in a significant way. This 
    //                      value need not change after a typo is fixed, only after a substantial 
    //                      modification. Generally, different entries in a feed will have different 
    //                      updated timestamps.
    LastUpdatedTime = DateTimeOffset.Now,
    // published (Optional) - Contains the time of the initial creation or first availability of the entry.
    PublishDate = DateTimeOffset.Now,
    // rights (Optional) - Conveys information about rights, e.g. copyrights, held in and over the entry.
    Copyright = new TextSyndicationContent(
        string.Format("© {0} - {1}", DateTime.Now.Year, "Rehan Saeed")),
};

// link (Recommended) - Identifies a related Web page. An entry must contain an alternate link if there 
//                      is no content element.
item.Links.Add(SyndicationLink.CreateAlternateLink(
    new Uri("http://example.com/item1"), 
    ContentType.Html));
// AND/OR
// Text content  (Optional) - Contains or links to the complete content of the entry. Content must be 
//                            provided if there is no alternate link.
// item.Content = SyndicationContent.CreatePlaintextContent("The actual plain text content of the entry");
// HTML content (Optional) - Content can be plain text or HTML. Here is a HTML example.
// item.Content = SyndicationContent.CreateHtmlContent("The actual HTML content of the entry");

// author (Optional) - Names one author of the entry. An entry may have multiple authors. An entry must 
//                     contain at least one author element unless there is an author element in the 
//                     enclosing feed, or there is an author element in the enclosed source element.
item.Authors.Add(this.GetPerson());

// contributor (Optional) - Names one contributor to the entry. An entry may have multiple contributor elements.
item.Contributors.Add(this.GetPerson());

// category (Optional) - Specifies a category that the entry belongs to. A entry may have multiple 
//                       category elements.
item.Categories.Add(new SyndicationCategory("Category 1"));

// link - Add additional links to related images, audio or video like so.
item.Links.Add(SyndicationLink.CreateMediaEnclosureLink(
    new Uri("http://example.com/item1/atom-icon-48x48.png"), 
    ContentType.Png, 
    0));

// media:thumbnail - Add a Yahoo Media thumbnail for the entry. See http://www.rssboard.org/media-rss 
//                   for more information.
item.SetThumbnail("http://example.com/item1/atom-icon-48x48.png", 48, 48);

items.Add(item);
```

Now it's actually possible to include a full HTML page inside a feed entry. Alternatively, you can provide plain text content or as I have done, provide a link to the full content. I have shown how to do all three in the comments above.

The next step is to actually reply to the client with a HTTP response containing the Atom 1.0 XML. Although Atom is just XML, it has it's own specific schema and has it's own MIME type `application/atom+xml`. Furthermore, the XML must actually be returned using the UTF-8 character encoding as per the standard. So here is our controllers action returning the feed:

```cs
[OutputCache(Duration = 86400)]
[Route("feed", Name = "GetFeed")]
public ActionResult Feed()
{
    SyndicationFeed feed = this.feedService.GetFeed();
    return new AtomActionResult(feed);
}
```

The above controller action is super simple, we take our `SyndicationFeed` and return it in a new `AtomActionResult` which is where all the magic happens. We also cache the response for a day, this is great for performance if your feed does not change very often. So what is `AtomActionResult`, well here is the code:

```cs
/// <summary>
/// Represents a class that is used to render an Atom 1.0 feed by using an <see cref="SyndicationFeed"/> instance 
/// representing the feed.
/// </summary>
public sealed class AtomActionResult : ActionResult
{
    private readonly SyndicationFeed syndicationFeed;

    /// <summary>
    /// Initializes a new instance of the <see cref="AtomActionResult"/> class.
    /// </summary>
    /// <param name="syndicationFeed">The Atom 1.0 <see cref="SyndicationFeed" />.</param>
    public AtomActionResult(SyndicationFeed syndicationFeed)
    {
        this.syndicationFeed = syndicationFeed;
    }

    /// <summary>
    /// Executes the call to the ActionResult method and returns the created feed to the output response.
    /// </summary>
    /// <param name="context">The context in which the result is executed. The context information includes the 
    /// controller, HTTP content, request context, and route data.</param>
    public override void ExecuteResult(ControllerContext context)
    {
        context.HttpContext.Response.ContentType = "application/atom+xml";
        Atom10FeedFormatter feedFormatter = new Atom10FeedFormatter(this.syndicationFeed);
        XmlWriterSettings xmlWriterSettings = new XmlWriterSettings();
        xmlWriterSettings.Encoding = Encoding.UTF8;

        if (HttpContext.Current.IsDebuggingEnabled)
        {
            // Indent the XML for easier viewing but only in Debug mode. In Release mode, everything is output on 
            // one line for best performance.
            xmlWriterSettings.Indent = true;
        }

        using (XmlWriter xmlWriter = XmlWriter.Create(context.HttpContext.Response.Output, xmlWriterSettings))
        {
            feedFormatter.WriteTo(xmlWriter);
        }
    }
}
```

The above code is writing out the XML to the HTTP response in UTF-8 encoding and with the `application/atom+xml` MIME type. By default the XML is written out all in one line which is good for performance but not very good for legibility, so we also detect whether the application is being debugged and if so, indent the XML for better legibility.

After all our hard work, we can now navigate to the controller action and view our feed. Here is Internet Explorer's view of our Atom feed:

![Atom Feed Example in Internet Explorer](./images/Atom-Feed-Example-in-Internet-Explorer.png)

# Images

RSS and Atom have been around for over a decade now and there is precious little information out there on how to create a feed. One of the areas that lacked information was the logo and icon images. All the specification says is that the ratios of the images should be a 2:1 rectangle and a 1:1 square respectively.

My advice to you and what I ended up doing is looking at various examples on the internet of feeds and copy the image sizes they were using. I ended up with images of size 48x48 and 96x48 which seemed a common size.

# Adding a 'Subscribe to this page' Button

Firefox has a feature called 'Subscribe to this page' which is a button that users can add to their toolbar (The button is enabled by default on older versions of Firefox). The button detects whether the current page links to an RSS/Atom feed and if it does, the user can click on it to subscribe to the feed directly. Here is a quick screen-shot of the button:

![FireFox Subscribe to this Page Button](./images/FireFox-Subscribe-to-this-Page-Button.png)

To add this feature, we need to place a meta tag in the head of our page with a link to the Atom feed like so:

```xml
<link href="http://localhost/feed" rel="alternate" title="ASP.NET Core Boilerplate Feed" type="application/atom+xml">
```

This is a pretty minor feature I admit but it has potential. By doing this, we are linking our page to the Atom feed. This can be read by search engines too, so potentially there could be some benefit in terms of Search Engine Optimization (SEO). Of course this is impossible to prove as search engines jealously guard how they manage their search rankings.

# PubSubHubbub

The problem with feeds is that you have to pull the information from them. You are never notified of new changes to the feed, so clients have to constantly poll the feed to check for any new feed entries.

This is the problem that [PubSubHubbub](https://github.com/pubsubhubbub) (I know, it has a terrible name!) solves. It's been developed by Google and it's actually an [open standard](https://pubsubhubbub.googlecode.com/git/pubsubhubbub-core-0.4.html), with the latest version of the standard being 0.4 at the time of writing.

There are already major platforms supporting it. Mostly they are Google products as you would expect but WordPress which powers a third of the worlds websites also supports it.

At the heart of it, you now have a hub that knows how to speak the PubSubHubbub standard language. When a feed is updated with a new entry, the website sends a message to the hub to tell it that the feed has been updated. Clients can then register for updates with the hub and get notified instantly when there is an update.

The coolest thing though is that all of this is super easy to implement, since Google provides us with a [hub](http://pubsubhubbub.appspot.com/) that we can use and we don't need to write our own. We just need to add a line of XML in our Atom feed telling clients that we support PubSubHubbub and the URL to the hub we want to use:

```xml
<link rel="hub" href="https://pubsubhubbub.appspot.com/" />
```

Now when there is an update to the feed, we need to publish that update to the hub linked to above. We do that by calling the simple method below:

```cs
/// <summary>
/// Publishes the fact that the feed has updated to subscribers using the PubSubHubbub v0.4 protocol.
/// </summary>
public Task PublishUpdate()
{
    HttpClient httpClient = new HttpClient();
    return httpClient.PostAsync(
        "https://pubsubhubbub.appspot.com/", 
        new FormUrlEncodedContent(
            new KeyValuePair<string, string>()
            {
                new KeyValuePair<string, string>("hub.mode", "publish"),
                new KeyValuePair<string, string>(
                    "hub.url", 
                    "http://localhost/feed")
            }));
}
```

It's as simple as that from the publishers side. On the client side, subscribing to the changes in the feed is only a little more complicated than this. I won't cover that but you can find out more by reading the [official specification](https://pubsubhubbub.googlecode.com/git/pubsubhubbub-core-0.4.html).

# Feed Paging

The Atom specification actually outlines how you can add paging to your feed. This is a great way to split up your feed if you are worried that it consumes too much bandwidth. Adding paging involves inserting the following links into the top of your feed. The links are the first, last, next and previous pages of your feed. Obviously, if you don't have a next or previous page, those links can be omitted.

```xml
<link rel="first" href="http://example.com/feed"/>
<link rel="next" href="http://example.com/feed?page=4"/>
<link rel="previous" href="http://example.com/feed?page=2"/>
<link rel="last" href="http://example.com/feed?page=10"/>
```

Here is the corresponding code to add the above links:

```cs
feed.Links.Add(new SyndicationLink(new Uri("http://example.com/feed"), "first", null, null, 0));
feed.Links.Add(new SyndicationLink(new Uri("http://example.com/feed?page=10"), "last", null, null, 0));

if (hasPreviousPage)
{
    feed.Links.Add(new SyndicationLink(new Uri("http://example.com/feed?page=2")), "previous", null, null, 0));
}

if (hasNextPage)
{
    feed.Links.Add(new SyndicationLink(new Uri("http://example.com/feed?page=4"), "next", null, null, 0));
}
```

# Feed Validation

Once you are done building your feed and have published it online, don't forget to check [FeedValidator.org](http://feedvalidator.org/) to ensure that your feed conforms to the Atom 1.0 specification.

# Conclusion

As always, you can look at a full working example of all of this code on the [ASP.NET Core Boilerplate](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) [GitHub page](https://github.com/Dotnet-Boxed/Templates).
