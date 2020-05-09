---
title: "Reactive Extensions (Rx) - Part 2 - Wrapping C# Events"
description: "Reactive Extensions IObservable wrappers for C# events and hiding the C# events entirely from subscribers using explicit interface implementations."
author: "Muhammad Rehan Saeed"
permalink: "/reactive-extensions-part2-wrapping-events/"
heroImage: "/images/hero/Reactive-Extensions-1366x768.png"
date: "2014-02-13"
dateModified: null
published: true
series: "Reactive Extensions (Rx)"
seriesOrder: 2
categories:
  - "Reactive Extensions (Rx)"
tags:
  - ".NET"
  - "C#"
  - "Events"
  - "Explicit Interface Implementation"
  - "INotifyPropertyChanged"
  - "Reactive Extensions"
  - "Rx"
---

- [Reactive Extensions (Rx) - Part 1 - Replacing C# Events](/reactive-extensions-part1-replacing-events/)
- [Reactive Extensions (Rx) - Part 2 - Wrapping C# Events](/reactive-extensions-part2-wrapping-events/)
- [Reactive Extensions (Rx) - Part 3 - Naming Conventions](/reactive-extensions-part3-naming-conventions/)
- [Reactive Extensions (Rx) - Part 4 - Replacing Timers](/reactive-extensions-part4-replacing-timers/)
- [Reactive Extensions (Rx) - Part 5 - Awaiting Observables](/reactive-extensions-part4-awaiting-observables/)
- [Reactive Extensions (Rx) - Part 6 - Task ToObservable](/reactive-extensions-part6-task-toobservable/)
- [Reactive Extensions (Rx) - Part 7 - Sample Events](/reactive-extensions-part7-sample-events/)
- [Reactive Extensions (Rx) - Part 8 - Timeouts](/reactive-extensions-rx-part-8-timeouts/)

Sometimes it is not possible to replace a C# event with a Reactive Extensions (Rx) event entirely. This is usually because we are implementing an interface which has a C# event and we don't own the interface.

However, as I'll show in this post, its possible to create `IObservable<T>` wrappers for C# events and even to hide the C# events entirely from consumers of the class.

The method of wrapping C# events depends on the type of event handler used. Below are the three type of event handler and the method of wrapping them with an observable event.

# Wrapping an EventHandler C# Event

The `FromEventPattern` method is used to wrap the event. Notice we have to specify delegates for subscribing (`+=`) and unsubscribing (`-=`) to the event.

```cs
public event EventHandler BunnyRabbitsAttack;

public IObservable<object> WhenBunnyRabbitsAttack
{
    get
    {
        return Observable
            .FromEventPattern(
                h => this.BunnyRabbitsAttack += h,
                h => this.BunnyRabbitsAttack -= h);
    }
}
```

# Wrapping an EventHandler<T> C# Event

This example is much the same as the last, except we have to deal with the event arguments. The `FromEventPattern` method returns an `EventPattern<T>` object, which contains the sender and the event arguments. We're only interested in the contents of the event arguments, so we use a Select to return just the `BunnyRabbits` property.

```cs
public event EventHandler<BunnyRabbitsEventArgs> BunnyRabbitsAttack;

public IObservable<BunnyRabbits> WhenBunnyRabbitsAttack
{
    get
    {
        return Observable
            .FromEventPattern<BunnyRabbitsEventArgs>(
                h => this.BunnyRabbitsAttack += h,
                h => this.BunnyRabbitsAttack -= h)
            .Select(x => x.EventArgs.BunnyRabbits);
    }
}
```

# Wrapping a Custom Event Handler C# Event

Some C# events use a custom event handler. In this case we have to specify the type of the event handler as a generic argument in the `FromEventPattern` method.

```cs
public event BunnyRabbitsEventHandler BunnyRabbitsAttack;

public IObservable<BunnyRabbits> WhenBunnyRabbitsAttack
{
    get
    {
        return Observable
            .FromEventPattern<BunnyRabbitsEventHandler, BunnyRabbitsEventArgs>(
                h => this.BunnyRabbitsAttack += h,
                h => this.BunnyRabbitsAttack -= h)
            .Select(x => x.EventArgs.BunnyRabbits);
    }
}
```

# Hiding Existing Events Using Explicit Interface Implementation

The disadvantage of the above approach is that we now have two ways to access our event. One with the old style C# event and the other with our new Reactive Extensions event. With a bit of trickery we can hide the C# event in some cases.

The `INotifyPropertyChanged` interface is very commonly used by XAML developers. It has a single event called `PropertyChanged`. To hide the `PropertyChanged` C# event we can explicitly implement the interface (Click [here](http://stackoverflow.com/questions/143405/c-sharp-interfaces-implicit-implementation-versus-explicit-implementation) for details on implicit versus explicit implementations of interfaces). Secondly, we wrap the event as we did before.

Now the `PropertyChanged` C# event can only be accessed by first casting the object to `INotifyPropertyChanged` (Binding in XAML languages, which uses this interface continues to work). Our new Reactive Extensions observable event is now the default method of subscribing for property changed events.

```cs
public abstract class NotifyPropertyChanges : INotifyPropertyChanged
{
    event PropertyChangedEventHandler INotifyPropertyChanged.PropertyChanged
    {
        add { this.propertyChanged += value; }
        remove { this.propertyChanged -= value; }
    }

    private event PropertyChangedEventHandler propertyChanged;

    public IObservable<string> WhenPropertyChanged
    {
        get
        {
            return Observable
                .FromEventPattern<PropertyChangedEventHandler, PropertyChangedEventArgs>(
                    h => this.propertyChanged += h,
                    h => this.propertyChanged -= h)
                .Select(x => x.EventArgs.PropertyName);
        }
    }

    protected void OnPropertyChanged(string propertyName) =>
        this.propertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
}
```

# Summing Up

So it may not always be possible to get rid of, dare I say it legacy C# events but we can certainly wrap them with Reactive Extension observables and even hide them altogether.
