---
title: "Reactive Extensions (Rx) – Part 8 – Timeouts"
description: "Should you use Reactive Extensions (Rx) to do timeouts in .NET? It turns out it's better to use CancellationTokenSource in the Task Parallel Library (TPL)."
author: "Muhammad Rehan Saeed"
permalink: "/reactive-extensions-rx-part-8-timeouts/"
cover_image: "./images/Reactive-Extensions.png"
date: "2017-01-02"
published: true
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

- [Reactive Extensions (Rx) - Part 1 - Replacing C# Events](/reactive-extensions-part1-replacing-events/)
- [Reactive Extensions (Rx) - Part 2 - Wrapping C# Events](/reactive-extensions-part2-wrapping-events/)
- [Reactive Extensions (Rx) - Part 3 - Naming Conventions](/reactive-extensions-part3-naming-conventions/)
- [Reactive Extensions (Rx) - Part 4 - Replacing Timers](/reactive-extensions-part4-replacing-timers/)
- [Reactive Extensions (Rx) - Part 5 - Awaiting Observables](/reactive-extensions-part4-awaiting-observables/)
- [Reactive Extensions (Rx) - Part 6 - Task ToObservable](/reactive-extensions-part6-task-toobservable/)
- [Reactive Extensions (Rx) - Part 7 - Sample Events](/reactive-extensions-part7-sample-events/)
- [Reactive Extensions (Rx) - Part 8 - Timeouts](/reactive-extensions-rx-part-8-timeouts/)

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

I'm using an overload on CancellationTokenSource which takes a timeout value. Then passing the `CancellationToken` to `DownloadTheInternet`. This method should be periodically checking the `CancellationToken` to see if it has been cancelled and if so, throw an `OperationCanceledException`. In this example you'd probably use HttpClient which handles this for you if you give it the CancellationToken.

The main reason why this method is better is that the task is actually being cancelled and stopped from doing any more work. In my above reactive extensions example, the task continues doing work but it's result is just ignored.
