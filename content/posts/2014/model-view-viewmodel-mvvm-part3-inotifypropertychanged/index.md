---
title: "Model-View-ViewModel (MVVM) - Part 3 - INotifyPropertyChanged"
description: "An base class implementation for the INotifyPropertyChanged interface. Used in the Model-View-ViewModel (MVVM) pattern. Targeted for best performance."
author: "Muhammad Rehan Saeed"
permalink: "/model-view-viewmodel-mvvm-part3-inotifypropertychanged/"
cover_image: "/images/hero/MVVM-1366x768.png"
date: "2014-06-18"
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
  - "Events"
  - "Explicit Interface Implementation"
  - "INotifyPropertyChanged"
  - "INotifyPropertyChanging"
  - "Model-View-ViewModel (MVVM)"
---

- [Model-View-ViewModel (MVVM) - Part 1 - Overview](/model-view-viewmodel-mvvm-part1-overview/)
- [Model-View-ViewModel (MVVM) - Part 2 - IDisposable](/model-view-viewmodel-mvvm-part2-idisposable/)
- [Model-View-ViewModel (MVVM) - Part 3 - INotifyPropertyChanged](/model-view-viewmodel-mvvm-part3-inotifypropertychanged/)
- [Model-View-ViewModel (MVVM) - Part 4 - INotifyDataErrorInfo](/model-view-viewmodel-mvvm-part4-inotifydataerrorinfo/)

I know there have been lots of Model-View-ViewModel (MVVM) articles talking about [INotifyPropertyChanged](http://msdn.microsoft.com/en-GB/library/system.componentmodel.inotifypropertychanged.aspx). I've read **lots** of them and this is the aggregation of all the knowledge I've learned plus some cool new stuff (I've not seen it done anywhere else but I could be wrong) which I've also covered in my [Reactive Extensions (Rx) posts](/reactive-extensions-part1-replacing-events/).

So what are the main aims of a base class implementing [INotifyPropertyChanged](http://msdn.microsoft.com/en-GB/library/system.componentmodel.inotifypropertychanged.aspx)? Well, I think there are a few:

- Performance - Performance is king. It needs to be fast and I mean **really** fast. You can't afford for your UI to freeze up while your view works out all its bindings to the properties in your view model.
- Simplicity - I want to raise property changed events with one line of code and I don't want to mess around with strings if I can help it.
- Reactive Extensions (Rx) - Events are old school, I want an observable property changed event notification system instead of the `PropertyChanged` C# event.
- Human Error - I don't want to raise property change events for properties that don't exist by accident.
- Dependent Properties - Often, the value of one property depends on the value of another. I need to handle this somehow.
- Re-factoring - I don't want my code to break when I rename a property and forget to rename a string too.
- Has it Really Changed - I don't want to raise a property changed event if the value of a property has not really changed.

So, without further ado, here is my implementation.

```cs
namespace Framework.ComponentModel
{
    using System;
    using System.ComponentModel;
    using System.Diagnostics;
    using System.Reactive.Linq;
    using System.Reflection;
    using System.Runtime.CompilerServices;

    /// <summary>
    /// Notifies subscribers that a property in this instance is changing or has changed.
    /// </summary>
    public abstract class NotifyPropertyChanges : Disposable, INotifyPropertyChanged //, INotifyPropertyChanging
    {
        /// <summary>
        /// Occurs when a property value changes.
        /// </summary>
        event PropertyChangedEventHandler INotifyPropertyChanged.PropertyChanged
        {
            add { this.propertyChanged += value; }
            remove { this.propertyChanged -= value; }
        }

        /// <summary>
        /// Occurs when a property value is changing.
        /// </summary>
        // event PropertyChangingEventHandler INotifyPropertyChanging.PropertyChanging
        // {
        //     add { this.PropertyChanging += value; }
        //     remove { this.PropertyChanging -= value; }
        // }

        /// <summary>
        /// Occurs when a property value changes.
        /// </summary>
        private event PropertyChangedEventHandler propertyChanged;

        /// <summary>
        /// Occurs when a property value is changing.
        /// </summary>
        // private event PropertyChangingEventHandler PropertyChanging;

        /// <summary>
        /// Gets the when property changed observable event. Occurs when a property value changes.
        /// </summary>
        /// <value>
        /// The when property changed observable event.
        /// </value>
        public IObservable<string> WhenPropertyChanged
        {
            get
            {
                this.ThrowIfDisposed();

                return Observable
                    .FromEventPattern<PropertyChangedEventHandler, PropertyChangedEventArgs>(
                        h => this.propertyChanged += h,
                        h => this.propertyChanged -= h)
                    .Select(x => x.EventArgs.PropertyName);
            }
        }

        /// <summary>
        /// Gets the when property changing observable event. Occurs when a property value is changing.
        /// </summary>
        /// <value>
        /// The when property changing observable event.
        /// </value>
        // public IObservable<EventPattern<PropertyChangingEventArgs>> WhenPropertyChanging
        // {
        //     get
        //     {
        //         return Observable
        //             .FromEventPattern<PropertyChangingEventHandler, PropertyChangingEventArgs>(
        //                 h => this.PropertyChanging += h,
        //                 h => this.PropertyChanging -= h)
        //             .AsObservable();
        //     }
        // }

        /// <summary>
        /// Raises the PropertyChanged event.
        /// </summary>
        /// <param name="propertyName">Name of the property.</param>
        protected virtual void OnPropertyChanged([CallerMemberName] string propertyName = null)
        {
            Debug.Assert(
                string.IsNullOrEmpty(propertyName) ||
                (this.GetType().GetRuntimeProperty(propertyName) != null),
                "Check that the property name exists for this instance.");

            PropertyChangedEventHandler eventHandler = this.propertyChanged;

            if (eventHandler != null)
            {
                eventHandler(this, new PropertyChangedEventArgs(propertyName));
            }
        }

        /// <summary>
        /// Raises the PropertyChanged event.
        /// </summary>
        /// <param name="propertyNames">The property names.</param>
        protected void OnPropertyChanged(params string[] propertyNames)
        {
            if (propertyNames == null)
            {
                throw new ArgumentNullException(nameof(propertyNames));
            }

            foreach (string propertyName in propertyNames)
            {
                this.OnPropertyChanged(propertyName);
            }
        }

        /// <summary>
        /// Raises the PropertyChanging event.
        /// </summary>
        /// <param name="propertyName">Name of the property.</param>
        protected virtual void OnPropertyChanging([CallerMemberName] string propertyName = null)
        {
            Debug.Assert(
                string.IsNullOrEmpty(propertyName) ||
                (this.GetType().GetRuntimeProperty(propertyName) != null),
                "Check that the property name exists for this instance.");

            // PropertyChangingEventHandler eventHandler = this.PropertyChanging;

            // if (eventHandler != null)
            // {
            //     eventHandler(this, new PropertyChangingEventArgs(propertyName));
            // }
        }

        /// <summary>
        /// Raises the PropertyChanging event.
        /// </summary>
        /// <param name="propertyNames">The property names.</param>
        protected void OnPropertyChanging(params string[] propertyNames)
        {
            if (propertyNames == null)
            {
                throw new ArgumentNullException(nameof(propertyNames));
            }

            foreach (string propertyName in propertyNames)
            {
                this.OnPropertyChanging(propertyName);
            }
        }

        /// <summary>
        /// Sets the value of the property to the specified value if it has changed.
        /// </summary>
        /// <typeparam name="TProp">The type of the property.</typeparam>
        /// <param name="currentValue">The current value of the property.</param>
        /// <param name="newValue">The new value of the property.</param>
        /// <param name="propertyName">Name of the property.</param>
        /// <returns><c>true</c> if the property was changed, otherwise <c>false</c>.</returns>
        protected bool SetProperty<TProp>(
            ref TProp currentValue,
            TProp newValue,
            [CallerMemberName] string propertyName = null)
        {
            this.ThrowIfDisposed();

            if (!object.Equals(currentValue, newValue))
            {
                this.OnPropertyChanging(propertyName);
                currentValue = newValue;
                this.OnPropertyChanged(propertyName);

                return true;
            }

            return false;
        }

        /// <summary>
        /// Sets the value of the property to the specified value if it has changed.
        /// </summary>
        /// <typeparam name="TProp">The type of the property.</typeparam>
        /// <param name="currentValue">The current value of the property.</param>
        /// <param name="newValue">The new value of the property.</param>
        /// <param name="propertyNames">The names of all properties changed.</param>
        /// <returns><c>true</c> if the property was changed, otherwise <c>false</c>.</returns>
        protected bool SetProperty<TProp>(
            ref TProp currentValue,
            TProp newValue,
            params string[] propertyNames)
        {
            this.ThrowIfDisposed();

            if (!object.Equals(currentValue, newValue))
            {
                this.OnPropertyChanging(propertyNames);
                currentValue = newValue;
                this.OnPropertyChanged(propertyNames);

                return true;
            }

            return false;
        }

        /// <summary>
        /// Sets the value of the property to the specified value if it has changed.
        /// </summary>
        /// <param name="equal">A function which returns <c>true</c> if the property value has changed, otherwise <c>false</c>.</param>
        /// <param name="action">The action where the property is set.</param>
        /// <param name="propertyName">Name of the property.</param>
        /// <returns><c>true</c> if the property was changed, otherwise <c>false</c>.</returns>
        protected bool SetProperty(
            Func<bool> equal, 
            Action action,
            [CallerMemberName] string propertyName = null)
        {
            this.ThrowIfDisposed();

            if (equal())
            {
                return false;
            }

            this.OnPropertyChanging(propertyName);
            action();
            this.OnPropertyChanged(propertyName);

            return true;
        }

        /// <summary>
        /// Sets the value of the property to the specified value if it has changed.
        /// </summary>
        /// <param name="equal">A function which returns <c>true</c> if the property value has changed, otherwise <c>false</c>.</param>
        /// <param name="action">The action where the property is set.</param>
        /// <param name="propertyNames">The property names.</param>
        /// <returns><c>true</c> if the property was changed, otherwise <c>false</c>.</returns>
        protected bool SetProperty(
            Func<bool> equal, 
            Action action,
            params string[] propertyNames)
        {
            this.ThrowIfDisposed();

            if (equal())
            {
                return false;
            }

            this.OnPropertyChanging(propertyNames);
            action();
            this.OnPropertyChanged(propertyNames);

            return true;
        }
    }
}
```

# Simple Example

An example of how you can use this base class is as follows.

```cs
public class CatCountViewModel : NotifyPropertyChanges
{
    private int numberOfCats;

    public int NumberOfCats
    {
        get => this.numberOfCats;
        set => this.SetProperty(ref this.numberOfCats, value);
    }
}
```

# Performance

As I said before, performance is king. A slow application is a frustrating application. However, there has always been a problem. When you want to raise a property changed event, you have to pass in a string. We can't check the validity of the string at compile time, only at runtime. So we can get errors due to typos etc. which can get overlooked.

There are a lot of implementations of [INotifyPropertyChanged](http://msdn.microsoft.com/en-GB/library/system.componentmodel.inotifypropertychanged.aspx) that use reflection or expression trees and as [this](http://blog.quantumbitdesigns.com/2010/01/26/mvvm-lambda-vs-inotifypropertychanged-vs-dependencyobject) and [this](http://blog.amusedia.com/2013/06/inotifypropertychanged-implementation.html) blog show, using reflection is a terribly slow method of raising an event and to be avoided.

Luckily, Microsoft introduced the [CallerMemberNameAttribute](http://msdn.microsoft.com/en-gb/library/system.runtime.compilerservices.callermembernameattribute.aspx) attribute, which means that as in the above example, we don't need to add a string for the property name, it gets added for us to the last optional parameter in the `SetProperty` method.

The `SetProperty` method uses the [ref keyword](http://msdn.microsoft.com/en-us/library/14akc2c7.aspx) to pass the parameter by reference (Passing parameters by reference is faster). It then checks to see if the `numberOfCats` parameter is different from the `value` parameter (There is no point raising a property changed event if they are the same). Only then, do we raise a property changed event.

# Handling Dependent Properties

But what about dependent properties. Where one property affects the value of another. Well, lets take a look at another example.

```cs
public class CatCounter : NotifyPropertyChanges
{
    private int numberOfCats;

    public int NumberOfCats
    {
        get => this.numberOfCats;
        set => this.SetProperty(ref this.numberOfCats, value, "NumberOfCats", "NumberOfCatsDescription");
    }

    public string NumberOfCatsDescription => $"{this.NumberOfCats} Cats Counted";
}
```

You can see, that I've not done anything spectacular and just passed in the strings. As I'm using the [params](http://msdn.microsoft.com/en-us/library/w5zay9db.aspx) keyword, you can pass in as many strings as you want and the `SetProperty` method will raise a property changed event for each one.

If you give me a moment, I will explain why I think this is the right compromise to make. Lets make no mistake, you do need to compromise between performance and simplicity/maintainability. There are approaches which make this eventuality simpler and easier to understand but they can and will degrade performance.

So does using strings cause problems? First of all, if you use a Visual Studio Add-in like Resharper, this problem is [solved](http://blog.jetbrains.com/dotnet/2012/07/24/inotifypropertychanged-support-in-resharper-7) as it checks that the strings match the property name for you. Secondly, as a backup the `OnPropertyChanged` method in the implementation above contains some `Debug.Assert` statements (These are removed in Release mode and have no effect on performance) to check that the property names exist and are correct, if they are not you get a error message. Thirdly, this is fairly rare in my experience and I can deal with the overhead of having a couple of extra strings.

Again, this is a choice I've made to go with performance over maintainability.

# Dealing with Wrapped Objects

What if you want to wrap an object that looks like the one below with a class that supports [INotifyPropertyChanged](http://msdn.microsoft.com/en-GB/library/system.componentmodel.inotifypropertychanged.aspx)? This is a scenario I have not seen many people cover but occurs fairly often in my experience.

```cs
public class CatCount
{
    public int Count { get; set; }
}
```

An example view model for the CatCount class can be found below.

```cs
public class CatCountModel : NotifyPropertyChanges
{
    private CatCount catCount;

    public int NumberOfCats
    {
        get { return this.catCount.Count; }
        set { this.SetProperty(() => this.catCount.Count == value, () => this.catCount.Count = value); }
    }
}
```

So here we are providing the `SetProperty` method with two delegates. We can't use the ref keyword we used earlier because this gives us the compiler error "A property, indexer or dynamic member access may not be passed as an out or ref parameter". So we use delegates as an alternative which is not as fast as the ref keyword but almost as fast.

The first delegate determines if the cat count has actually changed. Only if it has (Remember, executing a delegate is far cheaper than updating the UI), do we call the next delegate which actually sets the value. Finally the `SetProperty` method raises a property changed event.

# Using Reactive Extensions (Rx) to Replace the PropertyChanged Event

C# events are old school. Reactive Extensions (Rx) provides a cleaner and far more powerful drop-in replacement for C# events. I'm not going to go over the advantages of Reactive Extensions here but you can take a look at a series of blog posts I've done in the [past](/reactive-extensions-part1-replacing-events/).

We can hide the `PropertyChanged` C# event by explicitly implementing the interface (Click [here](http://stackoverflow.com/questions/143405/c-sharp-interfaces-implicit-implementation-versus-explicit-implementation) for details on implicit versus explicit implementations of interfaces).

The `PropertyChanged` C# event can still be accessed by first casting the object to [INotifyPropertyChanged](http://msdn.microsoft.com/en-GB/library/system.componentmodel.inotifypropertychanged.aspx). Binding in XAML languages, which uses this interface continues to work. Our new Reactive Extensions (Rx) observable event called `WhenPropertyChanged` of type `IObservable<string>` (The string is the property name) is now the default method of subscribing for property changed events and we've hidden away the old C# event.

# Implementing INotifyPropertyChanging

Take another look at the title of this paragraph, it says [INotifyPropertyChang**ing**](http://msdn.microsoft.com/en-us/library/system.componentmodel.inotifypropertychanging%28v=vs.110%29.aspx) and not [INotifyPropertyChang**ed**](http://msdn.microsoft.com/en-GB/library/system.componentmodel.inotifypropertychanged.aspx).

This interface has a single event called `PropertyChang**ing**` and is raised **before** a property is about to be changed. This interface is not actually used by any XAML framework but does complement the `INotifyPropertyChanged` interface and can be useful in your view models when you want to know that a property is about to change and do something about it.

Given that we've written a base class, it is super easy to include it too. You should note that this interface only exists in the full .NET Framework and Silverlight. It does not exist on Windows Store or Windows Phone platforms.

As we are writing a base class for a Portable Class Library (PCL), I've commented it out. However, if I were to create a full .NET or Silverlight class library, I would definitely put that code back in.

If you find the interface useful and you too are using a Portable Class Library (PCL), you could take a copy of the `INotifyPropertyChanging` interface and include it with your base class. If Microsoft ever decide to include it into the PCL, you simply need to remove your class and use the one in the framework.

# Conclusions

I've gone through many iterations to get to this base class. As I've shown, I've had very particular goals in mind. Your mileage may vary but I believe with the tools Microsoft have given us, this is a good compromise and covers all the scenarios I can think of. I'd be very interested if anyone has any comments or thoughts on improvements. Feel free to sound-off in the comments.
