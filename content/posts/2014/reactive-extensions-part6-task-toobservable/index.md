---
title: "Reactive Extensions (Rx) - Part 6 - Task ToObservable"
description: "How and where to use the Reactive Extensions (Rx) ToObservable Extension method to turn a Task Parallel Library (TPL) Task into an IObservable."
author: "Muhammad Rehan Saeed"
permalink: "/reactive-extensions-part6-task-toobservable/"
heroImage: "/images/hero/Reactive-Extensions-1366x768.png"
date: "2014-04-25"
dateModified: null
published: true
series: "Reactive Extensions (Rx)"
seriesOrder: 6
categories:
  - "Reactive Extensions (Rx)"
tags:
  - ".NET"
  - "C#"
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

# A Quick Recap

In my previous posts on Reactive Extensions (Rx) I've outlined a few clear areas where Reactive Extensions can be used in the real world. I've uncovered areas where it provides a cleaner and improved API surface as compared to older .NET code. Namely, replacing C# events, wrapping existing C# events and replacing `System.Threading.Timers` (Or other `Timer` classes, of which there are a few in .NET).

Once you have your observables, you need to do something with them. In my last post on the subject I showed how and when you can await an observable.

In this post I'm going to show how you can also go the other way around. You can turn tasks into an observable. I'll also show one clear reason to use this facility.

# Converting Tasks to Observables

The `ToObservable` extension method allows you to convert a Task or `Task<T>` into an `IObservable<T>`. Calling `ToObservable` on a `Task` returns an `IObservable<Unit>`. A `Unit` is a kind of empty object that does nothing, the only reason it is there is because there is no `IObservable` (Without the `T`) interface.

```cs
IObservable<Unit> observable = Task.Run(() => Console.WriteLine("Working")).ToObservable();

IObservable<string> observableT = Task<string>.Run(() => "Working").ToObservable();
```

If you subscribe to the above observables, they will only ever return one value and then complete. You might be thinking, hang on just a second Rehan, whats the point of doing this?

# Putting It All Together

So when should we use this feature? Well, lets walk through some examples and see what happens. Lets assume we have the following contrived code:

```cs
public Task<string> GetHelloString()
{
    return Task.Run(
        async () =>
        {
            await Task.Delay(500);
            return "Hello";
        });
}

public Task<string> GetWorldString()
{
    return Task.Run(
        async () =>
        {
            await Task.Delay(1000);
            return "World";
        });
}
```

What happens in the case where we call both of these methods and want to get the first result back. How does this code look using the Task Parallel Library (TPL) as compared to Reactive Extensions (Rx).

```cs
public async Task<string> WaitForFirstResultAndReturn()
{
    Task<string> task1 = this.GetHelloString();
    Task<string> task2 = this.GetWorldString();

    return await Task.WhenAny(task1, task2);
}

public async Task<string> WaitForFirstResultAndReturn()
{
    IObservable<string> observable1 = this.GetHelloString().ToObservable();
    IObservable<string> observable2 = this.GetWorldString().ToObservable();

    return await observable1.Merge(observable2).FirstAsync();
}
```

In the Task Parallel Library (TPL) example, I simply use the `WhenAny` method to await the first task that completes and then return the result.

In the Reactive Extensions example above, I'm converting my tasks to observables, using the Merge method to convert them to a single observable and then using the `FirstAsync` method to await the first result (We covered `await`'ing observables in the last post).

Overall the two techniques look pretty similar, with the TPL having a slight edge in terms of simplicity.

How about another example. Here we will try to await both of the results and put them together to get some meaningful result.

```cs
public async Task<string> WaitForAllResultsAndReturnCombinedResult()
{
    Task<string> task1 = this.GetHelloString();
    Task<string> task2 = this.GetWorldString();

    return string.Join(" ", await Task.WhenAll(task1, task2));
}

public async Task<string> WaitForAllResultsAndReturnCombinedResult()
{
    IObservable<string> observable1 = this.GetHelloString().ToObservable();
    IObservable<string> observable2 = this.GetWorldString().ToObservable();

    return await observable1.Zip(observable2, (x1, x2) => string.Join(" ", x1, x2));
}
```

In the Task Parallel Library (TPL) example, I'm using the `WhenAll` method to await the results of both tasks which are returned as an array of strings. I then join these strings and return the results.

In the Reactive Extensions example above, I'm converting my tasks to observables, then using the `Zip` method to combine the results returned from both observables by providing it with a delegate which joins the two strings.

Again, both look pretty similar but with the pure TPL example being slightly simpler to understand.

One more example, this time we'll return the first result but add a timeout to the equation.

```cs
public async Task<string> WaitForFirstResultAndReturnResultWithTimeOut()
{
    Task<string> task1 = this.GetHelloString();
    Task<string> task2 = this.GetWorldString();
    Task timeoutTask = Task.Delay(100);

    Task completedTask = await Task.WhenAny(task1, task2, timeoutTask);
    if (completedTask == timeoutTask)
    {
        throw new TimeoutException("The operation has timed out");
    }

    return ((Task<string>)completedTask).Result;
}

public async Task<string> WaitForFirstResultAndReturnResultWithTimeOut()
{
    IObservable<string> observable1 = this.GetHelloString().ToObservable();
    IObservable<string> observable2 = this.GetWorldString().ToObservable();

    return await observable1.Merge(observable2).Timeout(TimeSpan.FromMilliseconds(100)).FirstAsync();
}
```

In the Task Parallel Library (TPL) example, I'm awaiting a third task which represents the timeout. If the timeout task finishes first, I raise a `TimeoutException`.

In the Reactive Extensions example, we merge the two observables again but this time use the `Timeout` method to achieve the same results.

Here we have a clear winner, the Reactive Extensions code is more concise and easier to follow.

What happens when we combine the two approaches.

```cs
public async Task<string> WaitForFirstResultAndReturnResultWithTimeOut2()
{
    Task<string> task1 = this.GetHelloString();
    Task<string> task2 = this.GetWorldString();

    return await Task
        .WhenAny(task1, task2)
        .ToObservable()
        .Timeout(TimeSpan.FromMilliseconds(1000))
        .FirstAsync();
}
```

Here we use the `ToObservable` and `Timeout` methods right at the end. As you can see this combined approach gives us the best of both worlds and makes the code much easier to read.

# Conclusions

One definite reason to convert `Task`'s to Observables is to use the `Timeout` method. There may be other reasons but I'm having a hard time thinking of any right now. In fact, I'm having a hard time thinking of any other posts to make about Reactive Extensions (Rx). It's an interesting chunk of code and I've learned a lot writing this series of posts as I hope you have too.
