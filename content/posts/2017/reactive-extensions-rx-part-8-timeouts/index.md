---
title: "Reactive Extensions (Rx) - Part 8 - Timeouts"
description: "Should you use Reactive Extensions (Rx) to do timeouts in .NET? It turns out it's better to use CancellationTokenSource in the Task Parallel Library (TPL)."
author: "Muhammad Rehan Saeed"
permalink: "/reactive-extensions-rx-part-8-timeouts/"
heroImage: "/images/hero/Reactive-Extensions-1366x768.png"
date: "2017-01-02"
dateModified: null
published: true
series: "Reactive Extensions (Rx)"
seriesOrder: 8
categories:
  - "Reactive Extensions (Rx)"
  - "Task Parallel Library (TPL)"
tags:
  - ".NET"
  - "Base Class Library"
  - "BCL"
  - "Reactive Extensions"
  - "Rx"
  - "Task Parallel Library"
  - "TPL"
---

1. [Reactive Extensions (Rx) - Replacing C# Events](/reactive-extensions-part1-replacing-events/)
2. [Reactive Extensions (Rx) - Wrapping C# Events](/reactive-extensions-part2-wrapping-events/)
3. [Reactive Extensions (Rx) - Naming Conventions](/reactive-extensions-part3-naming-conventions/)
4. [Reactive Extensions (Rx) - Replacing Timers](/reactive-extensions-part4-replacing-timers/)
5. [Reactive Extensions (Rx) - Awaiting Observables](/reactive-extensions-part5-awaiting-observables/)
6. [Reactive Extensions (Rx) - Task ToObservable](/reactive-extensions-part6-task-toobservable/)
7. [Reactive Extensions (Rx) - Sample Events](/reactive-extensions-part7-sample-events/)
8. [Reactive Extensions (Rx) - Timeouts](/reactive-extensions-rx-part-8-timeouts/)

In [part six](/reactive-extensions-part6-task-toobservable/) of this series of blog posts I talked about using Reactive Extensions for adding timeout logic to asynchronous tasks. Something like this:

```cs
public async Task<string> WaitForFirstResultWithTimeOut()
{
    Task<string> task = this.DownloadTheInternet();
 
    return await task
        .ToObservable()
        .Timeout(TimeSpan.FromMilliseconds(1000))
        .FirstAsync();
}
```

Last week I was working on a project and wanted to add a Timeout to my task but since it was an ASP.NET MVC project, I had no references to Reactive Extensions. After some thought I discovered another possible method of performing a timeout which may help in certain circumstances.

```cs
using (var cancellationTokenSource = new CancellationTokenSource(TimeSpan.FromMilliseconds(1000)))
{
    try
    {
        return await this.DownloadTheInternet(cancellationTokenSource.Token);
    }
    catch (OperationCanceledException exception)
    {
        Console.WriteLine("Timed Out");
    }
}
```

I'm using an overload on `CancellationTokenSource` which takes a timeout value. Then passing the `CancellationToken` to `DownloadTheInternet`. This method should be periodically checking the `CancellationToken` to see if it has been cancelled and if so, throw an `OperationCanceledException`. In this example you'd probably use `HttpClient` which handles this for you if you give it the CancellationToken.

The main reason why this method is better is that the task is actually being cancelled and stopped from doing any more work. In my above reactive extensions example, the task continues doing work but it's result is just ignored.
