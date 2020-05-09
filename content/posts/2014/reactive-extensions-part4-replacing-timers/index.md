---
title: "Reactive Extensions (Rx) - Part 4 - Replacing Timers"
description: "You should definitely consider using Reactive Extensions (Rx) is as a direct replacement for .NET Timers. This post will explain how."
author: "Muhammad Rehan Saeed"
permalink: "/reactive-extensions-part4-replacing-timers/"
heroImage: "/images/hero/Reactive-Extensions-1366x768.png"
date: "2014-03-11"
dateModified: null
published: true
series: "Reactive Extensions (Rx)"
seriesOrder: 4
categories:
  - "Reactive Extensions (Rx)"
tags:
  - ".NET"
  - "C#"
  - "Reactive Extensions"
  - "Rx"
  - "Timer"
---

- [Reactive Extensions (Rx) - Part 1 - Replacing C# Events](/reactive-extensions-part1-replacing-events/)
- [Reactive Extensions (Rx) - Part 2 - Wrapping C# Events](/reactive-extensions-part2-wrapping-events/)
- [Reactive Extensions (Rx) - Part 3 - Naming Conventions](/reactive-extensions-part3-naming-conventions/)
- [Reactive Extensions (Rx) - Part 4 - Replacing Timers](/reactive-extensions-part4-replacing-timers/)
- [Reactive Extensions (Rx) - Part 5 - Awaiting Observables](/reactive-extensions-part4-awaiting-observables/)
- [Reactive Extensions (Rx) - Part 6 - Task ToObservable](/reactive-extensions-part6-task-toobservable/)
- [Reactive Extensions (Rx) - Part 7 - Sample Events](/reactive-extensions-part7-sample-events/)
- [Reactive Extensions (Rx) - Part 8 - Timeouts](/reactive-extensions-rx-part-8-timeouts/)

Reactive Extensions (Rx) is a huge library. In this series of blog posts I've tried to illustrate real world applications where using Rx can significantly improve and/or simplify your code. So far I've talked about using Rx to replace standard C# events and also wrapping C# events with observables.

In this post I'm going to talk about another area where Rx provides a nicer API surface, as compared to an existing .NET API. In particular, I'm talking about the .NET Timers. There are a few different timers available in the .NET framework. The main ones being [System.Threading.Timer](http://msdn.microsoft.com/en-us/library/system.threading.timer%28v=vs.110%29.aspx) and [System.Timers.Timer](http://msdn.microsoft.com/en-us/library/system.timers.timer%28v=vs.110%29.aspx). Each one has their pros and cons but I'm not going to go into which ones are better as that's a whole [other conversation](http://stackoverflow.com/questions/1416803/system-timers-timer-vs-system-threading-timer).

# Existing .NET Timers

Below is a very simple example of how to use the `System.Timers.Timer` (`System.Threading.Timer` is very similar). We new-up a `Timer` with the number of milliseconds we want to timer to raise it's `Elapsed` event, register for the `Elasped` event and finally start the timer.

```cs
public void StartTimer()
{
    Timer timer = new Timer(5000);
    timer.Elapsed += this.OnTimerElapsed;
    timer.Start();
}

private void OnTimerElapsed(object sender, ElapsedEventArgs e)
{
    // Do Stuff Here
    Console.WriteLine(e.SignalTime);
    // Console WriteLine Prints
    // 11/03/2014 10:58:35
    // 11/03/2014 10:58:40
    // 11/03/2014 10:58:45
    // ...
}
```

# Reactive Extensions (Rx) Timers

Now here is how to do almost the exact same thing with Reactive Extensions. In this scenario we use the `Interval` method to specify the timer interval and simply subscribe to the observable. The only difference is that we don't get a `DateTime` with the time of the timer elapsed event but an integer representing the number of times the timer elapsed delegate has been fired (Much more useful in my opinion, as you can always derive the time from this number).

```cs
public void StartTimer()
{
    Observable
        .Interval(TimeSpan.FromSeconds(5))
        .Subscribe(
            x =>
            {
                // Do Stuff Here
                Console.WriteLine(x);
                    // Console WriteLine Prints
                    // 0
                    // 1
                    // 2
                    // ...
            });
}
```

But that's not all, Reactive Extensions provides another method which can be quite useful. In the example below which looks almost exactly the same, we use the `Timer` method instead of `Interval`. This method only calls the timer elapsed delegate once.

```cs
public void StartTimerAndFireOnce()
{
    Observable
        .Timer(TimeSpan.FromSeconds(5))
        .Subscribe(
            x =>
            {
                // Do Stuff Here
                Console.WriteLine(x);
                // Console WriteLine Prints
                // 0
            });
}
```

The `Timer` method has lots of overloads which you can take a look at. The example below calls the timer elapsed delegate every five seconds but only starts to do so, after a minute has passed.

```cs
public void StartTimerInOneMinute()
{
    Observable
        .Timer(TimeSpan.FromMinutes(1), TimeSpan.FromSeconds(5))
        .Subscribe(
            x =>
            {
                // Do Stuff Here
                Console.WriteLine(x);
                // Console WriteLine Prints
                // 0
                // 1
                // 2
                // ...
            });
}
```

The final thing you need to know about the `Interval` and `Timer` methods is that they can optionally take an `IScheduler` as a final parameter. This allows the timer elapsed delegate to be run on any thread of your choosing. In the example below we are subscribing the event on the WPF UI thread. There are several other `Scheduler`'s you can use, so just take a look.

```cs
public void StartTimerOnUIThread()
{
    Observable
        .Interval(TimeSpan.FromSeconds(5), DispatcherScheduler.Current)
        .Subscribe(
            x =>
            {
                // Do UI Stuff Here
            });
}
```

# Conclusions

If you haven't started using Reactive Extensions yet, then here is yet another reason to get going. What I have not shown in this post is the shear superhuman power you get when you use the Linq methods to modify your observable just before you make the call to `Subscribe`.
