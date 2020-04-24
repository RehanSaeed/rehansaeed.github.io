---
title: "C# 6.0 - Saving Developers From Themselves"
description: "C# 6.0 helps reduce human error and save developers from themselves using the nameof operator, string interpolation and the null-conditional operator."
author: "Muhammad Rehan Saeed"
permalink: "/c-6-0-saving-developers-from-themselves/"
heroImage: "/images/hero/NET-1366x768.png"
date: "2015-05-10"
dateModified: null
published: true
categories:
  - "C#"
tags:
  - ".NET"
  - "C#"
  - "C# 6.0"
  - "INotifyPropertyChanged"
  - "nameof"
---

# What's New in C# 6.0

If you haven't already taken a look at what's new in C# 6.0, you should certainly read [this](https://msdn.microsoft.com/en-us/magazine/dn802602.aspx) article. This blog post is going to cover how C# 6.0 can help reduce the number of bugs in your code by giving you the tools to avoid common developer mistakes.

In my opinion, the changes introduced in C# 6.0 can be split into two separate groups. The first group of changes seems to be a declaration of war on curly braces (`{}`), you can now omit them in many cases. I personally am not too sure about this set of features, it reduces the lines of code you have to write a little and may save a few seconds but at the cost of having to learn a new set of syntax. If you cast your mind back to being a newbie developer (or if you are one), lots of syntax to remember can be difficult to deal with.

This is a problem that C++ developers know well, C++ is a pretty old language now but is still undergoing rapid development with C++ 11, 14 and beyond. It's got to the stage where there are so many ways to skin a cat in C++, even experienced developers can be slowed down when looking at code using older patterns and paradigms. The C# caretakers need to be careful that each new feature is genuinely worth the effort and not just bloat.

The second set of features is what I am really interested in. These are features which will genuinely save you from yourself. They will stop developers making many common mistakes.

# The nameof Operator

The nameof operator simply gives you the name of any type you pass into it. You can take a look at the simple example below:

```cs
string obiwan;  
Console.WriteLine(nameof(obiwan));
// Prints obiwan
  
int kenobi = 2;
Console.WriteLine(nameof(kenobi));
// Prints kenobi
```

## Argument Exceptions

So where can this help us? Well, I can think of a few examples, the first being throwing argument exceptions. Argument exceptions all take a parameter, which represents the name of the invalid parameter. In the past, we had to pass this as a string. The problem was that the parameter might get renamed and you might forget to update the string to reflect that.

```cs
public void FightCrime(string hero)  
{
    if (hero == null)  
    {
        throw new ArgumentNullException("hero");
    }

    // Omitted crime fighting code...  
}
```

```cs
public void FightCrime(string hero)  
{
    if (hero == null)  
    {
        throw new ArgumentNullException(nameof(hero));
    }

    // Omitted crime fighting code...  
}
```

With the second example, if you used Visual Studio to rename the hero parameter, then the hero in the `nameof` operator will also be updated.

## INotifyPropertyChanged

This interface is notorious if you are doing any WPF/Silverlight/WinRT/XAML development, for requiring strings to be passed to it. With the `nameof` operator, this becomes a thing of the past.

```cs
public class Ship : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler PropertyChanged;	
    
    private string name;
	
    public string Name
    {
        get { return this.name; }
        set
        {
            this.name = value;
            this.OnPropertyChanged(nameof(this.Name));
        }
    }
	
    protected virtual void OnPropertyChanged(string propertyName)
    {
        PropertyChangedEventHandler eventHandler = this.PropertyChanged;
        if (eventHandler != null)
        {
            eventHandler(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
```

## ASP.NET MVC

ASP.NET MVC makes massive use of strings everywhere. This is a massive problem when you want to rename something. In fact, I've taken to using constants everywhere. It's more work to setup but in the long run its much easier to maintain. Here is an example of how we can use nameof to create a link and do away with strings and constants:

```cs
@Html.ActionLink("Home", "Index", "Home")

@Html.ActionLink2("Home", nameof(HomeController.Index), nameof(HomeController))

public static MvcHtmlString ActionLink2(this HtmlHelper htmlHelper, string linkText, string actionName, string controllerName)
{
    htmlHelper.ActionLink(linkText, actionName, controllerName.Substring(0, controllerName.Length - 10));
}
```

The above example is a little contrived. In the real world, I would never use `ActionLink` and use `RouteLink` instead. Naming your routes has better performance and is just easier to understand when you have multiple routes with the same name (for GET and POST requests).

# String Interpolation

I think we've all used `string.Format` and got our arguments in the wrong positions or entered the index numbers incorrectly at some point in time. Well, that bug is now a thing of the past.

```cs
// Before C# 6.0 String Interpolation
string nameAndAge = string.Format("Name:{0}, Age:{1}", name, age);
// After C# 6.0 String Interpolation
string nameAndAge = $"Name:{name}, Age:{age}";
```

As you can see, you can now use your parameters directly in the strings with full syntax highlighting and renaming support too. In fact the C# 6.0 code actually compiles down to doing a `string.Format` behind the scenes.

# The Null-Conditional Operator

Every C# developer has at some point stared at the text from a `NullReferenceException` and thought in their head, this is a really rubbish message and leaves out vital information. In fact there is [this](https://visualstudio.uservoice.com/forums/121579-visual-studio/suggestions/2371587-better-nullpointerexception-error-message) post on UserVoice, asking Microsoft to improve their NullReferenceException messages. It turns out that Microsoft has thought of this, they haven't improved the message (They still should, please up-vote the UserVoice post) but they have introduced the Null-Conditional operator.

```cs
public string Truncate(string value, int length)
{
    string result = value;
    if (value != null)
    {
        result = value.Substring(0, Math.Min(value.Length, length));
    }
    return result;
}
```

```cs
public string Truncate(string value, int length)
{          
    return value?.Substring(0, Math.Min(value.Length, length));

    // Wow, look at all this code I didn't have to write!
}
```

# Conclusions

As you can see there is a common theme with two of the three C# 6.0 features I've picked above. They give us tools to better deal with strings which have terrible IDE and language support. Making a typo in a string gives us no compile time errors and Visual Studio doesn't help either. Each of these features has allowed us to deal with strongly typed objects instead, which have full language and IDE support.

The Null-Conditional operator is another great tool to help mitigate really common but minor bugs that catch even the most experienced developers out. These are great features, and should help stop silly mistakes that all of us developers make. We are after all, human.
