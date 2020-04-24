---
title: "ConfigureAwait in Task Parallel Library (TPL)"
description: "The importance of using ConfigureAwait when using the Task Parallel Library (TPL) to improve performance and reduce context switching."
author: "Muhammad Rehan Saeed"
permalink: "/configureawait-task-parallel-library/"
heroImage: "/images/hero/NET-1366x768.png"
date: "2014-02-07"
dateModified: null
published: true
categories:
  - "Task Parallel Library (TPL)"
tags:
  - ".NET"
  - "C#"
  - "ConfigureAwait"
  - "HttpClient"
  - "Task Parallel Library"
  - "ThreadPool"
  - "Threads"
  - "TPL"
---

The Task Parallel Library in conjunction with the `async` and `await` keywords are great but there are some subtleties which you should consider. One of these is the use of the ConfigureAwait method.

If I wanted to get a list of the titles of the new posts from my RSS feed I could write the following code:

```cs
private async Task<IEnumerable<string>> GetBlogTitles()
{
    // Current Thread = UI Thread
    HttpClient httpClient = new HttpClient();

    // GetStringAsync = ThreadPool Thread
    string rss = await httpClient.GetStringAsync("https://rehansaeed.com/feed/");

    // Current Thread = UI Thread
    List<string> blogTitles = XDocument.Parse(rss)
        .Descendants("item")
        .Elements("title")
        .Select(x => x.Value)
        .ToList();

    // Current Thread = UI Thread
    return blogTitles;
}

public async Task UpdateUserInterface()
{
    // Current Thread = UI Thread
    IEnumerable<string> blogTitles = await this.GetBlogTitles();

    // Current Thread = UI Thread
    this.ListBox.ItemsSource = blogTitles;
}
```

If I was to call this method, then the entire method would execute on the calling thread except the bit where we call `GetStringAsync` which would go off and do its work on the ThreadPool thread and then we come back onto the original thread and do all our XML manipulation.

Now if this was a client WPF or WinRT application which has a UI thread, all of the XML manipulation we are doing would be done on the UI thread. This is placing extra burden on the UI thread which could mean application freeze ups if the UI thread is being heavily taxed. The solution is simple, we add `ConfigureAwait(false)` to the end of the call we are making to get the RSS XML. So now our new code looks like this:

```cs
private async Task<IEnumerable<string>> GetBlogTitles()
{
    // Current Thread = UI Thread
    HttpClient httpClient = new HttpClient();

    // GetStringAsync = ThreadPool Thread
    string rss = await httpClient.GetStringAsync("https://rehansaeed.com/feed/").ConfigureAwait(false);

    // Current Thread = ThreadPool Thread
    List<string> blogTitles = XDocument.Parse(rss)
        .Descendants("item")
        .Elements("title")
        .Select(x => x.Value)
        .ToList();

    // Current Thread = ThreadPool Thread
    return blogTitles;
}

public async Task UpdateUserInterface()
{
    // Current Thread = UI Thread
    IEnumerable<string> blogTitles = await this.GetBlogTitles();

    // Current Thread = UI Thread
    this.ListBox.ItemsSource = blogTitles;
}
```

So now all our XML manipulation is done on the `ThreadPool` thread along with the HTTP GET we are doing using the `HttpClient`. Notice however, that when we return the blog titles to the calling method we are back on the UI thread. Each time you do an `await`, the default behaviour is to continue on the thread we started with. By adding `ConfigureAwait(false)`, we are overriding this behaviour to continue on whatever thread the Task was running on.

For more on the Task Parallel Library (TPL) I highly recommend reading [Stephen Toub's](http://blogs.msdn.com/b/toub/ "Stephen Toub's") blog.
