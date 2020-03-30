---
title: "Model-View-ViewModel (MVVM) - Part 2 - IDisposable"
description: "Implementing IDisposable correctly is ridiculously hard. A Disposable base class can make it easier. Using IDisposable in Model-View-ViewModel (MVVM) really helps."
author: "Muhammad Rehan Saeed"
permalink: "/model-view-viewmodel-mvvm-part2-idisposable/"
cover_image: "./images/hero/MVVM-1366x768.png"
date: "2014-06-13"
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
  - "IDisposable"
  - "Model-View-ViewModel (MVVM)"
  - "MVVM"
  - "Reactive Extensions"
  - "Rx"
---

- [Model-View-ViewModel (MVVM) - Part 1 - Overview](/model-view-viewmodel-mvvm-part1-overview/)
- [Model-View-ViewModel (MVVM) - Part 2 - IDisposable](/model-view-viewmodel-mvvm-part2-idisposable/)
- [Model-View-ViewModel (MVVM) - Part 3 - INotifyPropertyChanged](/model-view-viewmodel-mvvm-part3-inotifypropertychanged/)
- [Model-View-ViewModel (MVVM) - Part 4 - INotifyDataErrorInfo](/model-view-viewmodel-mvvm-part4-inotifydataerrorinfo/)

View models these days interact with all kinds of precious resources like Compasses and the GPS. Implementing `IDisposable` is an important pattern you can follow to dispose of these resources cleanly. Freeing them up to be used elsewhere and saving the users battery (Particularly important on mobile devices). Using the `IDisposable` interface in the Model-View-ViewModel (MVVM) pattern is a wise decision.

Implementing `IDisposable` **correctly** is ridiculously hard. If you don't know how hard it really is, I recommend reading the top comment on [this](http://stackoverflow.com/questions/538060/proper-use-of-the-idisposable-interface) Stack Overflow article.

Implementing [IDisposable](http://msdn.microsoft.com/en-GB/library/system.idisposable.aspx) is one of the rare times in C# where a developer has to use [C# Destructors](http://msdn.microsoft.com/en-us/library/66x5fx1b.aspx) and also one of the few times when we have to tickle the garbage collector to stop it from trying to release the unmanaged resources twice by calling [SuppressFinalize](http://msdn.microsoft.com/en-us/library/system.gc.suppressfinalize%28v=vs.110%29.aspx) on [GC](http://msdn.microsoft.com/en-us/library/system.gc%28v=vs.110%29.aspx).

Having to write this code repeatedly is difficult and error prone, so how about a base class?

```cs
namespace Framework.ComponentModel
{
    using System;
    using System.Reactive;
    using System.Reactive.Linq;
    using System.Reactive.Subjects;

    /// <summary>
    /// Base class for members implementing <see cref="IDisposable"/>.
    /// </summary>
    public abstract class Disposable : IDisposable
    {
        private bool isDisposed;
        private Subject<Unit> whenDisposedSubject;

        /// <summary>
        /// Finalizes an instance of the <see cref="Disposable"/> class. Releases unmanaged
        /// resources and performs other cleanup operations before the <see cref="Disposable"/>
        /// is reclaimed by garbage collection. Will run only if the
        /// Dispose method does not get called.
        /// </summary>
        ~Disposable() => this.Dispose(false);

        /// <summary>
        /// Gets the when errors changed observable event. Occurs when the validation errors have changed for a property or for the entire object.
        /// </summary>
        /// <value>
        /// The when errors changed observable event.
        /// </value>
        public IObservable<Unit> WhenDisposed
        {
            get
            {
                if (this.IsDisposed)
                {
                    return Observable.Return(Unit.Default);
                }
                else
                {
                    if (this.whenDisposedSubject == null)
                    {
                        this.whenDisposedSubject = new Subject<Unit>();
                    }

                    return this.whenDisposedSubject.AsObservable();
                }
            }
        }

        /// <summary>
        /// Gets a value indicating whether this <see cref="Disposable"/> is disposed.
        /// </summary>
        /// <value><c>true</c> if disposed; otherwise, <c>false</c>.</value>
        public bool IsDisposed => this.isDisposed;

        /// <summary>
        /// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.
        /// </summary>
        public void Dispose()
        {
            // Dispose all managed and unmanaged resources.
            this.Dispose(true);

            // Take this object off the finalization queue and prevent finalization code for this
            // object from executing a second time.
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Disposes the managed resources implementing <see cref="IDisposable"/>.
        /// </summary>
        protected virtual void DisposeManaged()
        {
        }

        /// <summary>
        /// Disposes the unmanaged resources implementing <see cref="IDisposable"/>.
        /// </summary>
        protected virtual void DisposeUnmanaged()
        {
        }

        /// <summary>
        /// Throws a <see cref="ObjectDisposedException"/> if this instance is disposed.
        /// </summary>
        protected void ThrowIfDisposed()
        {
            if (this.isDisposed)
            {
                throw new ObjectDisposedException(this.GetType().Name);
            }
        }

        /// <summary>
        /// Releases unmanaged and - optionally - managed resources.
        /// </summary>
        /// <param name="disposing"><c>true</c> to release both managed and unmanaged resources;
        /// <c>false</c> to release only unmanaged resources, called from the finalizer only.</param>
        private void Dispose(bool disposing)
        {
            // Check to see if Dispose has already been called.
            if (!this.isDisposed)
            {
                // If disposing managed and unmanaged resources.
                if (disposing)
                {
                    this.DisposeManaged();
                }

                this.DisposeUnmanaged();

                this.isDisposed = true;

                if (this.whenDisposedSubject != null)
                {
                    // Raise the WhenDisposed event.
                    this.whenDisposedSubject.OnNext(Unit.Default);
                    this.whenDisposedSubject.OnCompleted();
                    this.whenDisposedSubject.Dispose();
                }
            }
        }
    }
}
```

There are several interesting facets to this implementation.

1. There is a difference between disposing of managed and unmanaged resources in the disposable pattern. To facilitate this, there are two separate protected methods which can be overridden in a derived class to dispose of each of them.
2. The disposable pattern requires you to throw an `ObjectDisposedException` when you try to access a property or method after the object has been disposed. To achieve this, there is a `ThrowIfDisposed` helper method which can be added to the top of each property or method.
3. There is an `IsDisposed` property which can be useful if we don't know if the object is disposed or not.
4. Finally, there is a Reactive Extensions (Rx) observable `WhenDisposed` property. This allows us to register for the dispose event.

Here is an example of how the base class is used to dispose of both a managed and unmanaged (COM object) resources.

```cs
public class DisposableExample : Disposable
{
    private ManagedResource managedResource;
    private UnmanagedResource unmanagedResource;

    public void Foo()
    {
        this.ThrowIfDisposed();

        // Do Stuff
    }

    protected override void DisposeManaged() =>
        this.managedResource.Dispose();

    protected override void DisposeUnmanaged()
    {
        Marshal.ReleaseComObject(this.unmanagedResource);
        this.unmanagedResource = null;
    }
}
```

An example of how to dispose of an instance of the above object.

```cs
DisposableExample disposable = new DisposableExample();
disposable.WhenDisposed.Subscribe(x => Console.WriteLine("Disposed Event Fired"));
disposable.Dispose();
Console.WriteLine(disposable.IsDisposed);
```

As you can see, it looks a whole lot simpler and has some pretty cool helper functions and features. No more need to remember how to implement this complicated pattern.
