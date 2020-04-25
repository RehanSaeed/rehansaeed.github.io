---
title: "GetHashCode Made Easy"
description: "Implementing GetHashCode is hard work and little understood. Learn how to implement GetHashCode as quickly and as simply as possible."
author: "Muhammad Rehan Saeed"
permalink: "/gethashcode-made-easy/"
heroImage: "/images/hero/Microsoft-.NET-1366x768.png"
date: "2014-04-14"
dateModified: "2019-06-12"
published: true
categories:
  - "Base Class Library (BCL)"
tags:
  - ".NET"
  - "Base Class Library"
  - "BCL"
  - "C#"
  - "GetHashCode"
---

::: tip Update (2019-06-12)
I updated my HashCode implementation to cover a few more scenarios which I discuss below.
:::

::: tip Update (2018-08-14)
I updated this article to talk about a new `HashCode` class included in .NET Core 2.1 and licensing information for my code since I've been asked repeatedly.
:::

Implementing `GetHashCode` is hard work and little understood. If you take a look on MSDN or StackOverflow for a few pointers, you'll see a plethora of examples with all kinds of little used C# operators and magic numbers with little explanation for developers (Especially the newbies) what they are for and why we need them. This, for a method which exists on the `Object` class and is the root of all that is good and wholesome in C# is surprising.

Before I continue, I recommend reading [Eric Lippert's blog post](http://blogs.msdn.com/b/ericlippert/archive/2011/02/28/guidelines-and-rules-for-gethashcode.aspx) about the subject. He does not show any code, just goes into when and where we need to implement the `GetHashCode` method. Eric does a much better job than I could do but in short, `GetHashCode` is implemented wherever you implement the `Equals` method and ideally your class should be immutable.

Now down to the nitty gritty. How do we make implementing `GetHashCode` easy. Well, suppose we have the following class:

```cs
public sealed class SuperHero
{
    private readonly string name;
    private readonly int age;
    private readonly ReadOnlyCollection<string> powers;

    public SuperHero(string name, int age, IEnumerable<string> powers)
    {
        this.name = name;
        this.age = age;
        this.powers = new ReadOnlyCollection<string>(powers.ToList());
    }

    public int Age => this.age;

    public string Name => this.name;

    public ReadOnlyCollection<string> Powers => this.powers;

    public override bool Equals(object obj)
    {
        // ...
    } 

    public override int GetHashCode()
    {
        // TODO
    }
}
```

In our example we have an immutable object with a variety of fields of different types, including a collection. One possible implementation of `GetHashCode` according to the highest rated [StackOverflow post](http://stackoverflow.com/questions/263400/what-is-the-best-algorithm-for-an-overridden-system-object-gethashcode/263416#263416) (If modified to fit our example and deal with nulls) may be:

```cs
public override int GetHashCode()
{
    unchecked
    {
        int hashCode = 17;

        hashCode = (hashCode * 23) + (name == null ? 0 : this.name.GetHashCode());

        hashCode = (hashCode * 23) + this.age;

        foreach (string power in this.powers)
        {
            hashCode = (hashCode * 23) + (power == null ? 0 : power.GetHashCode());
        }

        return hashCode;
    }
}
```

I don't know about you but that code looks awfully unwieldy to me. For a start we've got two different magic numbers 17 and 23. Why? As it happens these are prime numbers and reduces the chance of getting collisions between hashes (Two un-equal objects are supposed to have different hash codes but sometimes this is not the case due to hash collisions that can occur).

We've also got the `unchecked` C# keyword which stops overflow checking to improve performance (That's not something you see every day). Bear in mind that the whole point of the `GetHashCode` method is to allow things like the `Dictionary` type to **quickly** retrieve objects.

I personally would not be able to remember how to do this each time I need to implement `GetHashCode` and it seems like you could very easily introduce bugs by making a typo. How about a helper class (Well actually a `struct` for better performance)?

```cs
/// <summary>
/// A hash code used to help with implementing <see cref="object.GetHashCode()"/>.
/// </summary>
public struct HashCode : IEquatable<HashCode>
{
    private const int EmptyCollectionPrimeNumber = 19;
    private readonly int value;

    /// <summary>
    /// Initializes a new instance of the <see cref="HashCode"/> struct.
    /// </summary>
    /// <param name="value">The value.</param>
    private HashCode(int value) => this.value = value;

    /// <summary>
    /// Performs an implicit conversion from <see cref="HashCode"/> to <see cref="int"/>.
    /// </summary>
    /// <param name="hashCode">The hash code.</param>
    /// <returns>The result of the conversion.</returns>
    public static implicit operator int(HashCode hashCode) => hashCode.value;

    /// <summary>
    /// Implements the operator ==.
    /// </summary>
    /// <param name="left">The left.</param>
    /// <param name="right">The right.</param>
    /// <returns>The result of the operator.</returns>
    public static bool operator ==(HashCode left, HashCode right) => left.Equals(right);

    /// <summary>
    /// Implements the operator !=.
    /// </summary>
    /// <param name="left">The left.</param>
    /// <param name="right">The right.</param>
    /// <returns>The result of the operator.</returns>
    public static bool operator !=(HashCode left, HashCode right) => !(left == right);

    /// <summary>
    /// Takes the hash code of the specified item.
    /// </summary>
    /// <typeparam name="T">The type of the item.</typeparam>
    /// <param name="item">The item.</param>
    /// <returns>The new hash code.</returns>
    public static HashCode Of<T>(T item) => new HashCode(GetHashCode(item));

    /// <summary>
    /// Takes the hash code of the specified items.
    /// </summary>
    /// <typeparam name="T">The type of the items.</typeparam>
    /// <param name="items">The collection.</param>
    /// <returns>The new hash code.</returns>
    public static HashCode OfEach<T>(IEnumerable<T> items) =>
        items == null ? new HashCode(0) : new HashCode(GetHashCode(items, 0));

    /// <summary>
    /// Adds the hash code of the specified item.
    /// </summary>
    /// <typeparam name="T">The type of the item.</typeparam>
    /// <param name="item">The item.</param>
    /// <returns>The new hash code.</returns>
    public HashCode And<T>(T item) => new HashCode(CombineHashCodes(this.value, GetHashCode(item)));

    /// <summary>
    /// Adds the hash code of the specified items in the collection.
    /// </summary>
    /// <typeparam name="T">The type of the items.</typeparam>
    /// <param name="items">The collection.</param>
    /// <returns>The new hash code.</returns>
    public HashCode AndEach<T>(IEnumerable<T> items)
    {
        if (items == null)
        {
            return new HashCode(this.value);
        }

        return new HashCode(GetHashCode(items, this.value));
    }

    /// <inheritdoc />
    public bool Equals(HashCode other) => this.value.Equals(other.value);

    /// <inheritdoc />
    public override bool Equals(object obj)
    {
        if (obj is HashCode)
        {
            return this.Equals((HashCode)obj);
        }

        return false;
    }

    /// <summary>
    /// Throws <see cref="NotSupportedException" />.
    /// </summary>
    /// <returns>Does not return.</returns>
    /// <exception cref="NotSupportedException">Implicitly convert this struct to an <see cref="int" /> to get the hash code.</exception>
    [EditorBrowsable(EditorBrowsableState.Never)]
    public override int GetHashCode() =>
        throw new NotSupportedException("Implicitly convert this struct to an int to get the hash code.");

    private static int CombineHashCodes(int h1, int h2)
    {
        unchecked
        {
            // Code copied from System.Tuple so it must be the best way to combine hash codes or at least a good one.
            return ((h1 << 5) + h1) ^ h2;
        }
    }

    private static int GetHashCode<T>(T item) => item?.GetHashCode() ?? 0;

    private static int GetHashCode<T>(IEnumerable<T> items, int startHashCode)
    {
        var temp = startHashCode;

        var enumerator = items.GetEnumerator();
        if (enumerator.MoveNext())
        {
            temp = CombineHashCodes(temp, GetHashCode(enumerator.Current));

            while (enumerator.MoveNext())
            {
                temp = CombineHashCodes(temp, GetHashCode(enumerator.Current));
            }
        }
        else
        {
            temp = CombineHashCodes(temp, EmptyCollectionPrimeNumber);
        }

        return temp;
    }
}
```

The helper struct can be used in our SuperHero class like so:

```cs
public override int GetHashCode()
{
    return HashCode
        .Of(this.name)
        .And(this.age)
        .AndEach(this.powers);
}
```

Now isn't that pretty? All the nasty magic numbers and `unchecked` code has been hidden away. It is a very lightweight and simple `struct`, so although we create new instances of it, it's stored in the stack rather than the memory heap. What's more, is that is code is just as fast (I've timed it)! We're using generics so there is no boxing or unboxing going on. We're still using the `unchecked` keyword, so overflow checking is still disabled.

One interesting edge case is what to do when hashing a collection and you get either a `null` or empty collection. Should you use a zero to represent both scenarios (zero is usually used to represent a `null` value) or differentiate them somehow. I managed to get a response from Jon Skeet himself on StackOverflow:

> if both states are valid, it seems perfectly reasonable to differentiate between them. (Someone carrying an empty box isn't the same as someone not carrying a box at all...)
> 
> [Jon Skeet](https://stackoverflow.com/questions/8094867/good-gethashcode-override-for-list-of-foo-objects-respecting-the-order/8094931?noredirect=1#comment99700237_8094931)

This is why we use the prime number 19 (it could have been any prime number) to represent an empty collection. Whether this matters or not depends on your use case. If an empty collection means something different in your scenario, then we've got you covered. Generally speaking though, if you are exposing a collection property in your class you should consider making it a getter only and initializing it in the constructor, so that it is never `null` in the first place but here we're trying to cover all scenarios.

# .NET Core HashCode

If you are using .NET Core 2.1, consider using the [System.HashCode](https://docs.microsoft.com/en-us/dotnet/api/system.hashcode?view=netcore-2.1) `struct` instead of my code. There are two ways to use it:

## HashCode.Combine

The `Combine` method can be used to create a hash code, given up to eight objects.

```cs
public override int GetHashCode() =>
  HashCode.Combine(object1, object2);
```

## HashCode.Add

The Add method is similar to my code but it does not handle collections and is not fluent:

```cs
public override int GetHashCode()
{
    var hash = new HashCode();
    hash.Add(this.object1);
    hash.Add(this.object2);
    return hash.ToHashCode();
}
```

## Advantages and Disadvantages

There are several advantages to using the .NET Core `HashCode`:

- It's part of the .NET Core base class library (BCL), so it's maintained and officially supported.
- It has good performance. I haven't written a benchmark against comparing my code to the .NET Core code. If you do, I'd be interested to hear the results.
- Like my code, it handles `null`'s automatically.

The disadvantages are:

- You have to be using .NET Core 2.1 or above.
- It does not handle collections, you have to write a for loop to handle that yourself. You could be clever and write a quick extension method to handle this scenario.
- It's not fluent, so you end up with slightly uglier code in my opinion. If you are a fan of C# 7 expression bodied members, then my fluent code lets you use them, while the .NET Core `HashCode.Add` method does not.

# License

I've been asked repeatedly for licensing of my code above. Developers have been asking permission to use it in a Kerbal Space program plugin and even in the excellent [Chocolatey](https://chocolatey.org) project which has been totally unexpected for me because this is code I wrote years ago. It just goes to show how fundamental `GetHashCode` is. Please consider the code as MIT licensed, do good with it and be excellent to each other!
