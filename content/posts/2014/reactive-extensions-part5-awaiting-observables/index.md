---
title: "Reactive Extensions (Rx) – Part 5 – Awaiting Observables"
description: "How and where to use Task Parallel Library (TPL) async and await with Reactive Extensions (Rx). Also, how to use TPL for awaiting observables."
author: "Muhammad Rehan Saeed"
permalink: "/reactive-extensions-part5-awaiting-observables/"
cover_image: "/images/hero/Reactive-Extensions-1366x768.png"
date: "2014-03-27"
published: true
categories:
  - "Reactive Extensions (Rx)"
tags:
  - ".NET"
  - "async await"
  - "Rx"
  - "Task Parallel Library"
  - "TaskCompletionSource"
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

So I've just finished extolling the wonderful virtues of `TaskCompletionSource` with a colleague and thought I'd share the joy more widely. Eventually this will turn into a post about how great Reactive Extensions (Rx) is, I promise.

# TaskCompletionSource

[TaskCompletionSource](http://msdn.microsoft.com/en-us/library/dd449174%28v=vs.110%29.aspx) is a great tool to turn any asynchronous operation which does not follow the Task Parallel Library (TPL) pattern into a Task. The example below is something I've started to do in a few places.

```cs
public Task<bool?> ShowDialog()
{
    TaskCompletionSource<bool?> taskCompletionSource = new TaskCompletionSource<bool?>();

    Window window = new MyDialogWindow();
    EventHandler eventHandler = null;
    eventHandler = 
        (sender, e) =>
        {
            window.Closed -= eventHandler;
            taskCompletionSource.SetResult(window.DialogResult);
        };
    window.Closed += eventHandler;
    window.Show();

    return taskCompletionSource.Task;
}
```

In the example above we are creating a new window, registering for its `Closed` event and then showing the window. When the window is closed, we de-register from the closed event handler (To avoid a remaining reference to the window, causing a memory leak) and the `DialogResult` of the window is passed to the `TaskCompletionSource` using the `SetResult` method.

The `TaskCompletionSource` gives us a nice `Task` object which we can return at the end of the method. When we return the task its status is `WaitingForActivation`. Only when the `SetResult` method is called when the window closes, does the tasks status change to `RanToCompletion`.

This whole operation has been wrapped up and packaged nicely in a `Task<bool?>` with a nice bow on top with the help of `TaskCompletionSource`. Now we can call the method and await the results from the method call, thus allowing us to savour the power and simplicity the TPL affords us.

```cs
bool? result = await ShowDialog();
```

There are other great ways to use `TaskCompletionSource` of course. Generally speaking though I have found myself using it to turn an operation where I am waiting for an event into a task. For [more information](http://blogs.msdn.com/b/pfxteam/archive/2009/06/02/9685804.aspx) on `TaskCompletionSource` or the TPL in general I highly recommend reading [Stephen Toub's blog](http://blogs.msdn.com/b/pfxteam/).

# Awaiting Observables

Having showed my colleague the above example and feeling very content, I suddenly realised that Reactive Extensions (Rx) can make the code even simpler. With the advent of the latest version of Reactive Extensions (Rx) you can now await observables and we can turn the method above into this:

```cs
public async Task<bool?> ShowDialog()
{
    var window = new MyDialogWindow();
    var closed = Observable
        .FromEventPattern<EventHandler, EventArgs>(
            h => window.Closed += h,
            h => window.Closed -= h);

    window.Show();
    await closed.FirstAsync()

    return window.DialogResult;
}
```

The `await` keyword is just some syntactic sugar in the C# language that makes writing thorny asynchronous code effortless. The real meat of what drives it is the `GetAwaiter` method. The Reactive Extensions (Rx) team seeing the genius that is the Task Parallel Library (TPL) took advantage. They added this method (actually an extension method) to `IObservable<T>`, allowing us to await an observable as seen in the example above.

However, there is a caveat which I shall explain. In the example above the Closed event could conceivably be fired any number of times (If the window was opened and closed a few times) and the observable wrapper around the Closed event never completes. So our observable returns multiple results but a task can only return a single result.

The secret in our example is the `FirstAsync` method. We are actually awaiting the first result returned by our observable and don't care about any further results. By default awaiting an observable without the `FirstAsync` method above will actually await the last result **before completion**. If your observable does not complete, then you will be waiting **forever**!

Handily the Reactive Extensions (Rx) team has added several methods which you can use before you use `await` to modify the result of what you are awaiting. All of these methods end with the word `Async`. I've added a short list of these methods below (There are lots of overloads so I've just highlighted the main ones):

```cs
// Returns the first element of an observable sequence.
string result = await observable.FirstAsync();

// Returns the first element of an observable sequence, or a default value if no such element exists.
string result = await observable.FirstOrDefaultAsync();

// Returns the last element of an observable sequence. 
// This is the default action of awaiting an observable.
string result = await observable.LastAsync();

// Returns the last element of an observable sequence, 
// or a default value if no such element exists.
string result = await observable.LastOrDefaultAsync();

// Returns the only element of an observable sequence, and throws an exception if there is not exactly 
// one element in the observable sequence.
string result = await observable.SingleAsync();

// Returns the only element of an observable sequence, or a default value if the observable sequence 
// is empty; this method reports an exception if there is more than one element in the observable sequence.
string result = await observable.SingleOrDefaultAsync();

// Invokes an action for each element in the observable sequence and returns a Task that will get 
// signalled when the sequence terminates.
await observable.ForEachAsync(x => Console.WriteLine(x));
```

All of the above methods allow you to pick a single result from your observable. `ForEachAsync` is different though as it performs an action on each item and when your observable completes (If it does) then the task completes.

# Conclusions

So we've learned how to await observables in different ways and how it can be another way of doing the same thing that `TaskCompletionSource` does but in a cleaner more elegant way.

We've also learned that there are some caveats that you need to be aware of when awaiting an observable i.e. that observables return multiple results and you have to pick one to return in your task.
