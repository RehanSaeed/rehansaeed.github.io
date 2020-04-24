---
title: "Model-View-ViewModel (MVVM) - Part 1 - Overview"
description: "What really goes into using Model-View-ViewModel (MVVM) in .NET. Base classes for INotifyPropertyChanged, INotifyDataErrorInfo, IDisposable and a lot more."
author: "Muhammad Rehan Saeed"
permalink: "/model-view-viewmodel-mvvm-part1-overview/"
cover_image: "/images/hero/MVVM-1366x768.png"
date: "2014-05-14"
dateModified: null
published: true
categories:
  - "Design Patterns"
  - "Model-View-ViewModel (MVVM)"
tags:
  - ".NET"
  - "Base Class Library"
  - "BCL"
  - "C#"
  - "Design Patterns"
  - "IEditableObject"
  - "INotifyDataErrorInfo"
  - "INotifyPropertyChanged"
  - "Model-View-ViewModel (MVVM)"
  - "MVVM"
---

- [Model-View-ViewModel (MVVM) - Part 1 - Overview](/model-view-viewmodel-mvvm-part1-overview/)
- [Model-View-ViewModel (MVVM) - Part 2 - IDisposable](/model-view-viewmodel-mvvm-part2-idisposable/)
- [Model-View-ViewModel (MVVM) - Part 3 - INotifyPropertyChanged](/model-view-viewmodel-mvvm-part3-inotifypropertychanged/)
- [Model-View-ViewModel (MVVM) - Part 4 - INotifyDataErrorInfo](/model-view-viewmodel-mvvm-part4-inotifydataerrorinfo/)

I've been meaning for some time to do a series of posts about Model-View-ViewModel (MVVM) and its potential base classes. Then I read [Mike Taulty's post](http://mtaulty.com/CommunityServer/blogs/mike_taultys_blog/archive/2014/05/09/windows-phone-8-1-and-xaml-apps-making-it-easier-for-mvvm-developers.aspx) about why MVVM 'bits' not built in to .NET.

My aim in these posts will be to either, pick off the shelf components which are best of breed where there is no point reinventing the wheel or build my own components where necessary.

Assuming you already know about the basic Model-View-ViewModel (MVVM) pattern described in the title image of this post, when we talk about MVVM, what do we really mean?

# Platforms

Well there are several .NET platforms that all provide some basic low level support for Model-View-ViewModel (MVVM), Windows Store, Windows Phone, Silverlight and Windows Presentation Foundation (WPF). It is all of these platforms that I'll be discussing and targeting my code towards.

# MVVM 'Bits'

In Mike Taulty's post, he goes through a list of 'bits' which all come together to help with building an application that fits into the MVVM design pattern. I've added to that list below:

1. `IDisposable` - When you have a scarce resource like a GPS, gyroscope or compass, you inevitably need to dispose of it somewhere. Implementing `IDisposable` **properly** is [hard work](http://msdn.microsoft.com/en-us/library/system.idisposable%28v=vs.110%29.aspx). A base class would be handy.
2. `INotifyPropertyChanged` - This is the building block of all .NET based MVVM. There needs to be a base class for this that is high performance and yet simple and easy to use.
3. `INotifyDataErrorInfo` - Validation is an often overlooked part of an application. This handy interface makes doing validation of your view models a cinch.
4. `IEditableObject` (WPF only) - This interface helps with implementing undo and redo but is used specifically in the WPF data grid.
5. `ObservableCollection<T>` - This collection is a good start out of the box but why does it still not have an AddRange method? Why do we not have an `ObservableDictionary<TKey, TValue>` or a `KeyedObservableCollection<TKey, TValue>`? What if you have a collection of items implementing `INotifyPropertyChanged` and you want to know if one of those items changes, why can't the collection type help you there also?
6. `ICommand` - Most implementations out there provide a base class for `ICommand` and usually call it `RelayCommand` or `DelegateCommand`. They usually have another implementation with a generic argument `RelayCommand<T>` or `DelegateCommand<T>`. These are a quick way to add a command to your view model, where the implementation of the command is usually a method in your view model passed in as a delegate. Sometimes though, this is not enough. What if you have a largish command and want to split it off into a separate class, a base class for `ICommand` would be useful. What if you have a command that does `async` and `await`? `ICommand` doesn't support that but can we provide some help here?
7. Inversion of control (IoC) - There are a lot of IoC frameworks out there already, why reinvent the wheel. Just pick one but which one?

I'll pause just here as I think the above listed items are all base classes that could be used across the board on all the major platforms. They are at the very heart of MVVM in .NET. The rest of the list below are more dependant on the type of application you are building.

1. Navigation - This has always been a stone in my shoe. Navigation is inherently something that happens in the view but it is something that view models often need to understand. The problem is, that the view model is not supposed to know about the view at all. This problem occurs again and again in different forms on each platform.

> - Navigating pages in Windows Store, Windows Phone, Silverlight.
> - Navigating Windows in Windows Presentation Foundation (WPF) and Windows Store.

1. User Interaction - I'm talking about `MessageBox`'s, `MessageDialog`'s, Toast's etc. Giving the user information or asking them questions happens on all platforms. This problem is very similar to the Navigation problem.
2. Connecting your Views to ViewModels - This is usually some by-product of which IoC container you choose to use, whether it's MEF, Unity, Autofac or some other. There is no recommended way of doing this and I don't think I've ever found a 'correct' way of doing this.
3. Saving View Model state - This usually needs to be done when the application closes or suspends due to some user interaction. A lot of frameworks simply serialize the whole View Model and save it away but is that the best way and what about doing that in a WPF application?
4. Events - Passing events between view models is a fairly useful ability, allowing communication and passing of state.
5. Composing Views - Some MVVM frameworks like PRISM provide support for composing different views together. Alternatively, this process usually has a connection with the type of IoC container you are using.
6. Firing Commands - A lot of controls can't fire off `ICommand`'s in XAML because they don't provide a Command property or sometimes you want to fire a command based on some event or even a key press.
7. Other Stuff - Reactive Extensions can help in some pretty interesting ways with MVVM. What about Portable Class Library's? Why does the MVVM on one platform need to be different from another?

The last two things in the list are more abstract requirements for any MVVM framework.

1. Testability - Writing a view model which is easy to test is hard work. Especially if you want to use `MessageBox`'s, GPS API's or other API's which make testing difficult. You don't want a `MessageBox` popping up in the middle of your test do you?
2. Performance - Your application needs to run fast, especially if it's running on a phone. For example, a lot of MVVM frameworks use expression trees and reflection to raise property changed notifications . What impact does this have in the performance versus maintainability trade off?

# Existing Frameworks

Wow, that's a lot of stuff! All of this 'stuff' is related but covers a huge range of subjects. A lot of existing MVVM frameworks try to do all of this at once!

In my humble opinion, because they do so much, they usually only cover some, say 70-80% of the full functionality. What business does an MVVM framework have including an IoC framework? There are lots of IoC frameworks out there that are far more powerful than anything we could write but a lot of MVVM frameworks include one too.

# Conclusions

So ideally what we need is something modular, that you can plug bits into but also something that covers all the bases.

Whats your opinion? I've looked at a lot of frameworks MVVM Light, PRISM, etc. In my opinion, the seven top items are the most important but also the most neglected bits of MVVM. Is there some framework out there that does all this and more?

I'll discuss this and a lot more in the coming posts.
