---
title: "Model-View-ViewModel (MVVM) - Part 4 - INotifyDataErrorInfo"
description: "An base class implementation for the INotifyDataErrorInfo interface. Used in the Model-View-ViewModel (MVVM) pattern. Targeted for best performance."
author: "Muhammad Rehan Saeed"
permalink: "/model-view-viewmodel-mvvm-part4-inotifydataerrorinfo/"
heroImage: "/images/hero/MVVM-1366x768.png"
date: "2014-09-09"
dateModified: null
published: true
series: "Model-View-ViewModel (MVVM)"
seriesOrder: 4
categories:
  - "Design Patterns"
  - "Model-View-ViewModel (MVVM)"
tags:
  - ".NET"
  - "Base Class Library"
  - "BCL"
  - "C#"
  - "Elysium Extra"
  - "Events"
  - "Explicit Interface Implementation"
  - "INotifyDataErrorInfo"
  - "INotifyPropertyChanged"
  - "Model-View-ViewModel (MVVM)"
---

- [Model-View-ViewModel (MVVM) - Part 1 - Overview](/model-view-viewmodel-mvvm-part1-overview/)
- [Model-View-ViewModel (MVVM) - Part 2 - IDisposable](/model-view-viewmodel-mvvm-part2-idisposable/)
- [Model-View-ViewModel (MVVM) - Part 3 - INotifyPropertyChanged](/model-view-viewmodel-mvvm-part3-inotifypropertychanged/)
- [Model-View-ViewModel (MVVM) - Part 4 - INotifyDataErrorInfo](/model-view-viewmodel-mvvm-part4-inotifydataerrorinfo/)

In this next part, I'm going to discuss validation of your view models using the [INotifyDataErrorInfo](http://msdn.microsoft.com/en-us/library/system.componentmodel.inotifydataerrorinfo%28v=vs.110%29.aspx) interface. Validation is an often ignored part of the Model-View-ViewModel (MVVM) story. If you need to create a form for your users to fill in (which is probably most applications, I would have thought), then you probably need to validate user input in some way and the [INotifyDataErrorInfo](http://msdn.microsoft.com/en-us/library/system.componentmodel.inotifydataerrorinfo%28v=vs.110%29.aspx) interface can get you there.

![INotifyDataErrorInfo Valid TextBox](./images/Valid.png)

That was a **valid** `TextBox` using `INotifyDataErrorInfo`.

![INotifyDataErrorInfo Invalid TextBox](./images/Invalid.png)

That was an **invalid** `TextBox` using `INotifyDataErrorInfo`.

In the example above you can see a name text box which requires text, to be in a valid state. In the valid state there is a big green tick next to the text box and conversely in an invalid state, there is a big yellow warning sign, the text box background becomes pink and you get a nice tool-tip telling you what the error is. By the way, this example is taken from my [Elysium Extra](https://github.com/RehanSaeed/Elysium-Extra) WPF project which is freely available on GitHub.

# How Does It Work?

You can see the interface and its corresponding event arguments below. If the name property in our view model changes and is empty then the state of our view model is invalid, we can raise the `ErrorsChanged` event, set the `HasErrors` property to return true and make any calls to `GetErrors` return a list of the errors (In our case we only have one but there could be multiple errors).

```cs
namespace System.ComponentModel
{
    public interface INotifyDataErrorInfo
    {
        bool HasErrors { get; }

        event EventHandler<DataErrorsChangedEventArgs> ErrorsChanged;

        IEnumerable GetErrors(string propertyName);
    }
    
    public class DataErrorsChangedEventArgs : EventArgs
    {
        public DataErrorsChangedEventArgs(string propertyName);

        public virtual string PropertyName { get; }
    }
}
```

That's a fair amount of work and a base class to do all that makes life much easier. So what are the main aims of a base class implementing `INotifyDataErrorInfo`?

- Integration - I usually want to raise an error in response to a property changing. So, we probably want to also implement `INotifyPropertyChanged`. Handily, I showed how best to create a base class for that in my last article in this series. So our new base class can inherit from the `NotifyPropertyChanges` base class.
- Performance - Performance is king. It needs to be fast and I mean really fast. You can't afford for your UI to freeze up while your view model works out if it has an error to raise or not. Some validation frameworks use an attribute based approach but this requires reflection so we will not be using that here.
- Reactive Extensions (Rx) - Events are old school, I want an observable error changed event notification system instead of the `ErrorsChanged` C# event.
- Human Error - I don't want to raise error change events for properties that don't exist by accident.
- Has it Really Error'ed - I don't want to raise a error changed event twice by accident or if it has not really error'ed.

So, without further ado, here is my implementation. Note that there are three classes:

```cs
namespace Framework.ComponentModel
{
    using System;
    using System.Collections;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Diagnostics;
    using System.Linq;
    using System.Reactive.Linq;
    using System.Reflection;
    using System.Runtime.CompilerServices;
    using Framework.ComponentModel.Rules;

    /// <summary>
    /// Provides functionality to provide errors for the object if it is in an invalid state.
    /// </summary>
    /// <typeparam name="T">The type of this instance.</typeparam>
    public abstract class NotifyDataErrorInfo<T> : NotifyPropertyChanges, INotifyDataErrorInfo
        where T : NotifyDataErrorInfo<T>
    {
        private const string HasErrorsPropertyName = "HasErrors";

        private static RuleCollection<T> rules = new RuleCollection<T>();

        private Dictionary<string, List<object>> errors;

        /// <summary>
        /// Occurs when the validation errors have changed for a property or for the entire object. 
        /// </summary>
        event EventHandler<DataErrorsChangedEventArgs> INotifyDataErrorInfo.ErrorsChanged
        {
            add { this.errorsChanged += value; }
            remove { this.errorsChanged -= value; }
        }

        /// <summary>
        /// Occurs when the validation errors have changed for a property or for the entire object. 
        /// </summary>
        private event EventHandler<DataErrorsChangedEventArgs> errorsChanged;

        /// <summary>
        /// Gets the when errors changed observable event. Occurs when the validation errors have changed for a property or for the entire object. 
        /// </summary>
        /// <value>
        /// The when errors changed observable event.
        /// </value>
        public IObservable<string> WhenErrorsChanged
        {
            get
            {
                return Observable
                    .FromEventPattern<DataErrorsChangedEventArgs>(
                        h => this.errorsChanged += h,
                        h => this.errorsChanged -= h)
                    .Select(x => x.EventArgs.PropertyName);
            }
        }

        /// <summary>
        /// Gets a value indicating whether the object has validation errors. 
        /// </summary>
        /// <value><c>true</c> if this instance has errors, otherwise <c>false</c>.</value>
        public virtual bool HasErrors
        {
            get
            {
                this.InitializeErrors();
                return this.errors.Count > 0;
            }
        }

        /// <summary>
        /// Gets the rules which provide the errors.
        /// </summary>
        /// <value>The rules this instance must satisfy.</value>
        protected static RuleCollection<T> Rules => rules;

        /// <summary>
        /// Gets the validation errors for the entire object.
        /// </summary>
        /// <returns>A collection of errors.</returns>
        public IEnumerable GetErrors() => this.GetErrors(null);

        /// <summary>
        /// Gets the validation errors for a specified property or for the entire object.
        /// </summary>
        /// <param name="propertyName">Name of the property to retrieve errors for. <c>null</c> to 
        /// retrieve all errors for this instance.</param>
        /// <returns>A collection of errors.</returns>
        public IEnumerable GetErrors(string propertyName)
        {
            Debug.Assert(
                string.IsNullOrEmpty(propertyName) ||
                (this.GetType().GetRuntimeProperty(propertyName) != null),
                "Check that the property name exists for this instance.");

            this.InitializeErrors();

            IEnumerable result;
            if (string.IsNullOrEmpty(propertyName))
            {
                List<object> allErrors = new List<object>();

                foreach (KeyValuePair<string, List<object>> keyValuePair in this.errors)
                {
                    allErrors.AddRange(keyValuePair.Value);
                }

                result = allErrors;
            }
            else
            {
                if (this.errors.ContainsKey(propertyName))
                {
                    result = this.errors[propertyName];
                }
                else
                {
                    result = new List<object>();
                }
            }

            return result;
        }

        /// <summary>
        /// Raises the PropertyChanged event.
        /// </summary>
        /// <param name="propertyName">Name of the property.</param>
        protected override void OnPropertyChanged([CallerMemberName] string propertyName = null)
        {
            base.OnPropertyChanged(propertyName);

            if (string.IsNullOrEmpty(propertyName))
            {
                this.ApplyRules();
            }
            else
            {
                this.ApplyRules(propertyName);
            }

            base.OnPropertyChanged(HasErrorsPropertyName);
        }

        /// <summary>
        /// Called when the errors have changed.
        /// </summary>
        /// <param name="propertyName">Name of the property.</param>
        protected virtual void OnErrorsChanged([CallerMemberName] string propertyName = null)
        {
            Debug.Assert(
                string.IsNullOrEmpty(propertyName) ||
                (this.GetType().GetRuntimeProperty(propertyName) != null),
                "Check that the property name exists for this instance.");

            EventHandler<DataErrorsChangedEventArgs> eventHandler = this.errorsChanged;

            if (eventHandler != null)
            {
                eventHandler(this, new DataErrorsChangedEventArgs(propertyName));
            }
        }

        /// <summary>
        /// Applies all rules to this instance.
        /// </summary>
        private void ApplyRules()
        {
            this.InitializeErrors();

            foreach (string propertyName in rules.Select(x => x.PropertyName))
            {
                this.ApplyRules(propertyName);
            }
        }

        /// <summary>
        /// Applies the rules to this instance for the specified property.
        /// </summary>
        /// <param name="propertyName">Name of the property.</param>
        private void ApplyRules(string propertyName)
        {
            this.InitializeErrors();

            List<object> propertyErrors = rules.Apply((T)this, propertyName).ToList();

            if (propertyErrors.Count > 0)
            {
                if (this.errors.ContainsKey(propertyName))
                {
                    this.errors[propertyName].Clear();
                }
                else
                {
                    this.errors[propertyName] = new List<object>();
                }

                this.errors[propertyName].AddRange(propertyErrors);
                this.OnErrorsChanged(propertyName);
            }
            else if (this.errors.ContainsKey(propertyName))
            {
                this.errors.Remove(propertyName);
                this.OnErrorsChanged(propertyName);
            }
        }

        /// <summary>
        /// Initializes the errors and applies the rules if not initialized.
        /// </summary>
        private void InitializeErrors()
        {
            if (this.errors == null)
            {
                this.errors = new Dictionary<string, List<object>>();

                this.ApplyRules();
            }
        }
    }
}

namespace Framework.ComponentModel.Rules
{
    using System;

    /// <summary>
    /// A named rule containing an error to be used if the rule fails.
    /// </summary>
    /// <typeparam name="T">The type of the object the rule applies to.</typeparam>
    public abstract class Rule<T>
    {
        private string propertyName;
        private object error;

        /// <summary>
        /// Initializes a new instance of the <see cref="Rule<T>"/> class.
        /// </summary>
        /// <param name="propertyName">The name of the property this instance applies to.</param>
        /// <param name="error">The error message if the rules fails.</param>
        protected Rule(string propertyName, object error)
        {
            if (propertyName == null)
            {
                throw new ArgumentNullException(nameof(propertyName));
            }

            if (error == null)
            {
                throw new ArgumentNullException(nameof(error));
            }

            this.propertyName = propertyName;
            this.error = error;
        }

        /// <summary>
        /// Gets the name of the property this instance applies to.
        /// </summary>
        /// <value>The name of the property this instance applies to.</value>
        public string PropertyName => this.propertyName;

        /// <summary>
        /// Gets the error message if the rules fails.
        /// </summary>
        /// <value>The error message if the rules fails.</value>
        public object Error => this.error;

        /// <summary>
        /// Applies the rule to the specified object.
        /// </summary>
        /// <param name="obj">The object to apply the rule to.</param>
        /// <returns>
        /// <c>true</c> if the object satisfies the rule, otherwise <c>false</c>.
        /// </returns>
        public abstract bool Apply(T obj);
    }
}

namespace Framework.ComponentModel.Rules
{
    using System;

    /// <summary>
    /// Determines whether or not an object of type <typeparamref name="T"/> satisfies a rule and
    /// provides an error if it does not.
    /// </summary>
    /// <typeparam name="T">The type of the object the rule can be applied to.</typeparam>
    public sealed class DelegateRule<T> : Rule<T>
    {
        private Func<T, bool> rule;

        /// <summary>
        /// Initializes a new instance of the <see cref="DelegateRule<T>"/> class.
        /// </summary>
        /// <param name="propertyName">>The name of the property the rules applies to.</param>
        /// <param name="error">The error if the rules fails.</param>
        /// <param name="rule">The rule to execute.</param>
        public DelegateRule(string propertyName, object error, Func<T, bool> rule)
            : base(propertyName, error)
        {
            if (rule == null)
            {
                throw new ArgumentNullException(nameof(rule));
            }

            this.rule = rule;
        }

        /// <summary>
        /// Applies the rule to the specified object.
        /// </summary>
        /// <param name="obj">The object to apply the rule to.</param>
        /// <returns>
        /// <c>true</c> if the object satisfies the rule, otherwise <c>false</c>.
        /// </returns>
        public override bool Apply(T obj) => this.rule(obj);
    }
}

namespace Framework.ComponentModel.Rules
{
    using System;
    using System.Collections.Generic;
    using System.Collections.ObjectModel;

    /// <summary>
    /// A collection of rules.
    /// </summary>
    /// <typeparam name="T">The type of the object the rules can be applied to.</typeparam>
    public sealed class RuleCollection<T> : Collection<Rule<T>>
    {
        /// <summary>
        /// Adds a new <see cref="Rule{T}"/> to this instance.
        /// </summary>
        /// <param name="propertyName">The name of the property the rules applies to.</param>
        /// <param name="error">The error if the object does not satisfy the rule.</param>
        /// <param name="rule">The rule to execute.</param>
        public void Add(string propertyName, object error, Func<T, bool> rule) =>
            this.Add(new DelegateRule<T>(propertyName, error, rule));

        /// <summary>
        /// Applies the <see cref="Rule{T}"/>'s contained in this instance to <paramref name="obj"/>.
        /// </summary>
        /// <param name="obj">The object to apply the rules to.</param>
        /// <param name="propertyName">Name of the property we want to apply rules for. <c>null</c>
        /// to apply all rules.</param>
        /// <returns>A collection of errors.</returns>
        public IEnumerable<object> Apply(T obj, string propertyName)
        {
            List<object> errors = new List<object>();

            foreach (Rule<T> rule in this)
            {
                if (string.IsNullOrEmpty(propertyName) || rule.PropertyName.Equals(propertyName))
                {
                    if (!rule.Apply(obj))
                    {
                        errors.Add(rule.Error);
                    }
                }
            }

            return errors;
        }
    }
}
```

# Simple Example

An example of how you can use this base class is as follows.

```cs
public class ZombieViewModel : NotifyDataErrorInfo<ZombieViewModel>
{
    private string name;
    private int limbsRemaining;

    static ZombieViewModel()
    {
        Rules.Add(new DelegateRule<ZombieViewModel>(
            "Name",
            "Name cannot be empty.",
            x => !string.IsNullOrEmpty(x.Name)));
        Rules.Add(new DelegateRule<ZombieViewModel>(
            "LimbsRemaining",
            "A zombie can't have less than zero limbs.",
            x => x.LimbsRemaining >= 0));
        Rules.Add(new DelegateRule<ZombieViewModel>(
            "LimbsRemaining",
            "A zombie can only have up to four limbs.",
            x => x.LimbsRemaining <= 4));
    }

    public string Name
    {
        get => this.name;
        set => this.SetProperty(ref this.name, value);
    }

    public int LimbsRemaining
    {
        get => this.limbsRemaining;
        set => this.SetProperty(ref this.limbsRemaining, value);
    }
}
```

As you can see, our view model has two properties and as shown in the last post in the series we are using the `SetProperty` method to raise `PropertyChanged` events. The only bit I've added for validation is in the static constructor containing the three validation rules.

The `Name` property has a single rule applied to it. When the name is empty a validation error is raised. The `LimbsRemaining` property has two rules and when it is less than zero or more than four, validation errors are raised auto-magically.

Under the covers, each time the `PropertyChanged` event is raised, we apply the corresponding rule relating to the property and if the rule fails, we raise the `ErrorsChanged` event, raise a `PropertyChanged` event for the `HasErrors` property (Which is now true) and finally ensure that any calls to `GetErrors` now returns the error shown in the rule.

# Extensibility

The `DelegateRule<T>` class shown above is a really easy way to provide nice, simple rules. If you need something more complex you can create your own rule by inheriting from the `Rule<T>` base class. An example of this could be a custom rule to validate an email address or telephone number.

# Using Reactive Extensions (Rx) to Replace the ErrorsChanged Event

C# events are old school. Reactive Extensions (Rx) provides a cleaner and far more powerful drop-in replacement for C# events. I'm not going to go over the advantages of Reactive Extensions here but you can take a look at a series of blog posts I've done in the [past](/reactive-extensions-part1-replacing-events/).

We can hide the `ErrorsChanged` C# event by explicitly implementing the interface (Click [here](http://stackoverflow.com/questions/143405/c-sharp-interfaces-implicit-implementation-versus-explicit-implementation) for details on implicit versus explicit implementations of interfaces).

The `ErrorsChanged` C# event can still be accessed by first casting the object to `INotifyDataErrorInfo`. Validation in XAML languages, which uses this interface continues to work. Our new Reactive Extensions (Rx) observable event called `WhenErrorsChanged` of type? `IObservable<string>` (The string is the property name) is now the default method of subscribing for error changed events and we've hidden away the old C# event.

# INotifyDataErrorInfo Support

The `INotifyDataErrorInfo` interface is supported by most XAML frameworks including WPF, Silverlight and Windows Phone. Currently WinRT does not support the interface at the time of writing but you can bet that they will in future and in the mean time you can use the [WinRT XAML Validation library](https://winrtxamlvalidation.codeplex.com/) in conjunction with the code below to plug this gap.

# Quick nod to IDataErrorInfo

This interface used to be used for validation but was replaced by `INotifyDataErrorInfo`. The new interface provides a much nicer API which is easier to code against and better performance. If you are still using the old interface, its time to make the change.

# Conclusions

I have been tweaking this base class for the last few years and feel I've got a fairly good balance. I've not seen too many implementations of this interface, most blogs seem to cover `INotifyPropertyChanged` pretty well though. I'd be very interested if anyone has any comments or thoughts on improvements. Feel free to sound-off in the comments.
