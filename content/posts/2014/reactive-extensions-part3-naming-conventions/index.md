---
title: "Reactive Extensions (Rx) - Part 3 - Naming Conventions"
description: "Reactive Extensions (Rx) Advantages of using IObservable property naming conventions and comparison between C# events."
author: "Muhammad Rehan Saeed"
permalink: "/reactive-extensions-part3-naming-conventions/"
heroImage: "/images/hero/Reactive-Extensions-1366x768.png"
date: "2014-02-14"
dateModified: null
published: true
series: "Reactive Extensions (Rx)"
seriesOrder: 3
categories:
  - "Reactive Extensions (Rx)"
tags:
  - ".NET"
  - "C#"
  - "Events"
  - "Naming Convention"
  - "Reactive Extensions"
  - "Rx"
  - "standards"
---

1. [Reactive Extensions (Rx) - Replacing C# Events](/reactive-extensions-part1-replacing-events/)
2. [Reactive Extensions (Rx) - Wrapping C# Events](/reactive-extensions-part2-wrapping-events/)
3. [Reactive Extensions (Rx) - Naming Conventions](/reactive-extensions-part3-naming-conventions/)
4. [Reactive Extensions (Rx) - Replacing Timers](/reactive-extensions-part4-replacing-timers/)
5. [Reactive Extensions (Rx) - Awaiting Observables](/reactive-extensions-part5-awaiting-observables/)
6. [Reactive Extensions (Rx) - Task ToObservable](/reactive-extensions-part6-task-toobservable/)
7. [Reactive Extensions (Rx) - Sample Events](/reactive-extensions-part7-sample-events/)
8. [Reactive Extensions (Rx) - Timeouts](/reactive-extensions-rx-part-8-timeouts/)

Standard C# events do not have any real naming convention, except using the English language to suggest that something has happened e.g. `PropertyChanged`. Should a property returning an `IObservable<T>` have a naming convention? I'm not entirely certain but I'll explain why I have used one and why.

C# events are easily differentiated in a class from properties and methods because they have a different icon in the Visual Studio Intelli-Sense. Visual Studio does not provide `IObservable<T>` properties any differentiation. This may change in the future if Microsoft decides to integrate Reactive Extensions (Rx) more deeply into Visual Studio.

The second reason for using a naming convention is that I often wrap existing C# events with a Reactive Extensions event. It's not possible to have the same name for a C# event and an `IObservable<T>` property.

You will have noticed already if you've looked at my previous posts that I use the word 'When' prefixed before the name of the property. I believe, this nicely indicates that an event has occurred and also groups all our Reactive Extension event properties together under Intelli-Sense.

```cs
public IObservable<string> WhenPropertyChanged
{
    get { ... };
}
```

I have read in a few places people suggesting that so called 'Hot' and 'Cold' (See [here](http://stackoverflow.com/questions/2521277/what-are-the-hot-and-cold-observables) for an explanation) observables should have different naming conventions. I personally feel that this is an implementation detail and I can't see why the subscriber to an event would need to know that an event was 'Hot' or 'Cold' (Prove me wrong). Also, trying to teach this concept to other developers and get them to implement it would mean constantly looking up the meanings (I keep forgetting myself), whereas using 'When' is a nice simple concept which anyone can understand.

This is a pretty open question at the moment. What are your thoughts on the subject?
