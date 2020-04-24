---
title: "Reactive Extensions (Rx) – Part 7 – Sample Events"
description: "Shows how to use the Reactive Extensions (Rx) Sample method to reduce the number of subscribed events by taking a sample from them over a given time period."
author: "Muhammad Rehan Saeed"
permalink: "/reactive-extensions-part7-sample-events/"
heroImage: "/images/hero/Reactive-Extensions-1366x768.png"
date: "2014-12-24"
dateModified: null
published: true
categories:
  - "Reactive Extensions (Rx)"
tags:
  - ".NET"
  - "C#"
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

Its been a while since I've done another Rx post. They've been pretty popular and thanks to the community for all the positive feedback. I was talking to a colleague yesterday who had been using standard C# events in WPF (The principals learned in this post can apply anywhere). He had subscribed to the TextChanged event in C# and was updating the user interface on the fly, whenever the user typed in a character of text. He was getting way too many events being fired and his user interface couldn't keep up with all the work it was being asked to do.

```cs
this.TextBox.TextChanged += this.OnTextBoxTextChanged;

private void OnTextBoxTextChanged(object sender, TextChangedEventArgs e)
{
    // Heavy User Interface updates that can cause the application to lock up.
}
```

This is a very common scenario which I myself have come across several times. The solution to this problem is to take a sample of the events being fired and only update the user interface every few seconds. This is possible without Reactive Extensions (Rx) but you have to write a fair amount of boilerplate code (I know, I've done it myself).

Reactive Extensions (Rx) can do this with a few easy to understand (This is the real bonus) lines of code. The first step is to wrap the WPF TextChanged event (I've shown how to do this in a previous post [here](/reactive-extensions-part2-wrapping-events/)).

```cs
public IObservable<TextChangedEventArgs> WhenTextChanged
{
    get
    {
        return Observable
            .FromEventPattern<TextChangedEventHandler, TextChangedEventArgs>(
                h => this.TextBox.TextChanged += h,
                h => this.TextBox.TextChanged -= h)
            .Select(x => x.EventArgs);
    }
}

this.WhenTextChanged
    .Sample(TimeSpan.FromSeconds(3))
    .Subscribe(x => Debug.WriteLine(DateTime.Now + " Text Changed"));
```

The final and most succinct step is to use the Sample method to only pick out the latest text changed event every three seconds and pass that on to the `Subscribe` delegate. It really is that easy and this blog post really is this short because of that!
