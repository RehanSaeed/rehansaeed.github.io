---
title: "Reactive Extensions (Rx) - Part 1 - Replacing C# Events"
description: "You should definitely consider using Reactive Extensions (Rx) is as a direct replacement for C# events. This post will explain how."
author: "Muhammad Rehan Saeed"
permalink: "/reactive-extensions-part1-replacing-events/"
cover_image: "/images/hero/Reactive-Extensions-1366x768.png"
date: "2014-02-11"
dateModified: null
published: true
categories:
  - "Reactive Extensions (Rx)"
tags:
  - ".NET"
  - "C#"
  - "Events"
  - "Reactive Extensions"
  - "Rx"
---

- [Reactive Extensions (Rx) - Part 1 - Replacing C# Events](/reactive-extensions-part1-replacing-events/)
- [Reactive Extensions (Rx) - Part 2 - Wrapping C# Events](/reactive-extensions-part2-wrapping-events/)
- [Reactive Extensions (Rx) - Part 3 - Naming Conventions](/reactive-extensions-part3-naming-conventions/)
- [Reactive Extensions (Rx) - Part 4 - Replacing Timers](/reactive-extensions-part4-replacing-timers/)
- [Reactive Extensions (Rx) - Part 5 - Awaiting Observables](/reactive-extensions-part4-awaiting-observables/)
- [Reactive Extensions (Rx) - Part 6 - Task ToObservable](/reactive-extensions-part6-task-toobservable/)
- [Reactive Extensions (Rx) - Part 7 - Sample Events](/reactive-extensions-part7-sample-events/)
- [Reactive Extensions (Rx) - Part 8 - Timeouts](/reactive-extensions-rx-part-8-timeouts/)

For those who have not tried Reactive Extensions (Rx) yet, I highly recommend it. If I had to describe it in a few words it would be 'Linq to events'. If you have not already learned about it, [this](http://www.introtorx.com/uat/content/v1.0.10621.0/00_Foreword.html) is by far the best resource on learning its intricacies.

I have spent a lot of time reading about Reactive Extensions but what I have not found in my research is examples or pointers on how or even where it should be used in preference to other code. One area where you should definitely consider using Reactive Extensions is as a direct replacement for bog standard C# events, which have been around since C# 1.0. This post will explain how.

# Exposing an Event

Here is an example of a standard C# event using the standard recommended pattern:

```cs
public class JetFighter
{
    public event EventHandler<JetFighterEventArgs> PlaneSpotted;

    public void SpotPlane(JetFighter jetFighter)
    {
        EventHandler<JetFighterEventArgs> eventHandler = this.PlaneSpotted;
        if (eventHandler != null)
        {
            eventHandler(this, new JetFighterEventArgs(jetfighter));
        }
    }
}
```

Now this is how you replace it using Reactive Extensions:

```cs
public class JetFighter
{
    private Subject<JetFighter> planeSpotted = new Subject<JetFighter>();

    public IObservable<JetFighter> PlaneSpotted => this.planeSpotted.AsObservable();

    public void SpotPlane(JetFighter jetFighter) => this.planeSpotted.OnNext(jetFighter);
}
```

So far it's all pretty straightforward, we have replaced the event with a property returning `IObservable<T>`. Raising the event is a simple matter of calling the `OnNext` method on the Subject class. Finally, we do not return our `Subject<T>` directly in our `PlaneSpotted` property, as someone could cast it back to `Subject<T>` and raise their own events! Instead we use the `AsObservable` method which returns a middle man. So far so good.

Reactive Extensions also has the added concept of errors and completion, which C# events do not have. These are optional added concepts and not required for replacing C# events directly but worth knowing about, as they add an extra dimension to events which may be useful to you.

The first concept is dealing with errors. What happens if there is an exception while you are spotting the plane and you want to notify your subscribers that there is a problem? Well you can do that, like this:

```cs
public void SpotPlane(JetFighter jetFighter)
{
    try
    {
        if (string.Equals(jetFighter.Name, "UFO"))
        {
            throw new Exception("UFO Found")
        }

        this.planeSpotted.OnNext(jetFighter);
    }
    catch (Exception exception)
    {
        this.planeSpotted.OnError(exception);
    }
}
```

Here we are using the `OnError` method to notify all the events subscribers that there has been an exception.

So what about the concept of completion? Well, that's just as simple. Suppose that you have spotted all the planes and you want to notify all your subscribers that there will be no more spotted planes. You can do that like this:

```cs
public void AllPlanesSpotted() => this.planeSpotted.OnCompleted();
```

So now all the code put together looks like this:

```cs
public class JetFighter
{
    private Subject<JetFighter> planeSpotted = new Subject<JetFighter>();

    public IObservable<JetFighter> PlaneSpotted => this.planeSpotted;

    public void AllPlanesSpotted() => this.planeSpotted.OnCompleted();

    public void SpotPlane(JetFighter jetFighter)
    {
        try
        {
            if (string.Equals(jetFighter.Name, "UFO"))
            {
                throw new Exception("UFO Found")
            }

            this.planeSpotted.OnNext(jetFighter);
        }
        catch (Exception exception)
        {
            this.planeSpotted.OnError(exception);
        }
    }
}
```

# Consuming an Event

Consuming the Reactive Extensions events is just as easy and this is where you start to see the real benefits of Reactive Extensions. This is how you subscribe and unsubscribe (often forgotten, which can lead to memory leaks) to a standard C# event:

```cs
public class BomberControl : IDisposable
{
    private JetFighter jetfighter;

    public BomberControl(JetFighter jetFighter) =>
        jetfighter.PlaneSpotted += this.OnPlaneSpotted;

    public void Dispose() =>
        jetfighter.PlaneSpotted -= this.OnPlaneSpotted;

    private void OnPlaneSpotted(object sender, JetFighterEventArgs e) =>
        JetFighter spottedPlane = e.SpottedPlane;
}
```

I'm not going to go into it in too much detail, you subscribe using `+=` and unsubscribe using `-=` operators.

This is how the same thing can be accomplished using Reactive Extensions:

```cs
public class BomberControl : IDisposable
{
    private IDisposable planeSpottedSubscription;

    public BomberControl(JetFighter jetFighter) =>
        this. planeSpottedSubscription = jetfighter.PlaneSpotted.Subscribe(this.OnPlaneSpotted);

    public void Dispose() =>
        this.planeSpottedSubscription.Dispose();

    private void OnPlaneSpotted(JetFighter jetFighter) =>
        JetFighter spottedPlane = jetfighter;
}
```

The key things to note here are first, the use of the `Subscribe` method to register for plane spotted events. Second, the subscription to the event is stored in an `IDisposable` which can later be disposed of, to un-register from the event. This is where things get interesting, since we now have an `IObservable<T>` we can now use all kinds of Linq queries on it like this:

```cs
jetfighter.PlaneSpotted.Where(x => string.Equals(x.Name, “Eurofighter”)).Subscribe(this.OnPlaneSpotted);
```

So in the above line of code, I'm using a Linq query to only register to events where the name of the spotted plane is `Eurofighter`. There are a lot more Linq methods you can use but that's beyond the scope of this post and also where you should take a look at [this website](http://www.introtorx.com/uat/content/v1.0.10621.0/00_Foreword.html).

# Conclusions

Reactive Extensions (Rx) is a pretty large library which does a lot of stuff which overlaps with other libraries like the Task Parallel Library (TPL). It brings no new capabilities but does bring new ways to do things (much like Linq), while writing less code and with more elegance. It can be confusing coming to it as a newcomer, as to where exactly it can be used effectively. Replacing basic events with `IObservable<T>` is definitely one area where we can leverage its power.
