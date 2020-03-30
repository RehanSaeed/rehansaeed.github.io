---
title: "A Simple and Fast Object Mapper"
description: ".NET Boxed mapper is an object to object mapper that is simpler and faster than Automapper and makes zero allocations of memory, thus making the garbage collector do less work."
author: "Muhammad Rehan Saeed"
permalink: "/a-simple-and-fast-object-mapper/"
cover_image: "/images/hero/Dotnet-Boxed-1366x768.png"
date: "2019-03-05"
published: true
categories:
  - "Entity Framework Core"
tags:
  - ".NET Boxed"
  - ".NET Core"
  - "Automapper"
  - "Benchmarks"
  - "Entity Framework Core"
---

I have a confession to make...I don't use [Automapper](https://github.com/AutoMapper/AutoMapper). For those who don't know Automapper is the number one object to object mapper library on NuGet by far. It takes properties from one object and copies them to another. I couldn't name the second place contender and looking on NuGet, nothing else comes close. This post talks about object mappers, why you **might** not want to use Automapper and introduces a faster, simpler object mapper that you **might** want to use instead.

# Why use an Object Mapper

This is a really good question. Most of the time, it boils down to using Entity Framework. Developers want to be good citizens and not expose their EF Core models in the API surface area because this can have really bad security implications (See overposting [here](https://docs.microsoft.com/en-us/aspnet/mvc/overview/getting-started/getting-started-with-ef-using-mvc/implementing-basic-crud-functionality-with-the-entity-framework-in-asp-net-mvc-application)).

I've received a lot of comments at this point in the conversation saying "Why don't you use [Dapper](https://github.com/StackExchange/Dapper) instead. Then you don't need model classes for your data layer, you can just go direct to your view model classes via Dapper". Dapper is really great, don't get me wrong but it's not always the right tool for the job, there are distinct disadvantages to using Dapper instead of EF Core:

1. I have to write SQL. That's not so bad (You should learn SQL!) but it takes time to context switch and you often find yourself copying and pasting code back and forth from SQL Management Studio or [Azure Data Studio](https://docs.microsoft.com/en-us/sql/azure-data-studio/what-is?view=sql-server-2017) (I've started using it, you should too). It just makes development a bit slower, that's all.
2. EF Core can be run in-memory, making for very fast unit tests. With Dapper, I have to run functional tests against a real SQL Server database which is slow, brittle and a pain to setup. Before each test, you need to ensure the database is setup with just the right data, so your tests are repeatable, otherwise you end up with flaky tests. Don't underestimate the power of this point.
3. EF Core Migrations can automatically generate the database for me. With Dapper, I have to use external tools like Visual Studio Database Projects, [DbUp](https://dbup.github.io/) or [Flyway](https://flywaydb.org/) to create my database. That's an extra headache at deployment time. EF Core lets you cut out the extra time required to manage all of that.
4. EF Core Migrations can automatically handle database migrations for me. Migrating databases is hard! Keeping track of what state the database is in and making sure you've written the right `ALTER TABLE` scripts is extra work that can be automated. EF Core handles all that for me. Alternatively, Visual Studio Database Projects can also get around this problem.
5. I can switch database provider easily. Ok...ok...nobody does this in the real world and I can only think of one case where this happened. People always mention this point though for some reason.
6. EF Core defaults to using the right data types, while on the other hand human beings...have too often chosen the wrong data types and then paid the penalties later on when the app is in production. Use `NVARCHAR` instead of `VARCHAR` and `DATETIMEOFFSET` instead of `DATETIME2` or even `DATETIME` people! I've seen professional database developers make these mistakes all the time. Automating this ensures that the correct decision is made all the time.
7. EF Core is not that much slower than using Dapper. We're not talking about orders of magnitude slower as it was with EF6. Throwing away all of the above benefits for slightly better speed is not a trade-off that everyone can make though, it depends on the app and situation.

You need to use the right tool for the right job. I personally use Dapper, where there is an existing database with all the migrations etc. already handled by external tools and use EF Core where I'm working with a brand new database.

# What is good about Automapper?

Automapper is great when you have a small project that you want to throw together quickly and the objects you are mapping to and from have the same or similar property names and structure.

It's also great for unit testing because once you've written your mapper, testing it is just a matter of adding a one liner to test that all the properties in your object have a mapping setup for them.

Finally if you use Automapper with Entity Framework, you can use the ProjectTo method which uses the property mapping information to limit the number of fields pulled back from your database making the query a lot more efficient. I think this is probably the biggest selling point of Automapper. The alternative is to write your own Entity Framework Core projection.

# What is wrong with Automapper?

Cezary Piatek writes a [very good rundown](https://cezarypiatek.github.io/post/why-i-dont-use-automapper/) of some of the problems when using Automapper. I'm not going to repeat what he says but here is a short description:

1. In the real world, mapping between identical or similar classes is not that common.
2. If you have similar classes you are mapping between, there is no guarantee that they will not diverge, requiring you to write increasingly complex Automapper code or rewriting the mapping logic without Automapper.
3. Finding all usages of a property no longer works when using Automapper unless you explicitly map every property, lowering discoverability.
4. If you have a complex scenario, [Jimmy Bogard](https://jimmybogard.com/) (the author of the tool) [suggests not using Automapper](https://jimmybogard.com/automapper-usage-guidelines/):
    - "DO NOT use AutoMapper except in cases where the destination type is a flattened subset of properties of the source type"
    - "DO NOT use AutoMapper to support a complex layered architecture"
    - "AVOID using AutoMapper when you have a significant percentage of custom configuration in the form of Ignore or MapFrom"
5. If you're mapping from database models to view models in an API, then dumping your database schema out as JSON makes for a bad API. You usually want more complex nested objects.
6. How much time does it really save? Object mapping code is the simplest code a developer can write, I can do it without thinking and knock a few mappings out in a couple of minutes.
7. Automapper is complex, it has a massive [documentation](https://automapper.readthedocs.io) site just to show you how to use it and just checkout the 29 point list of [guidelines](https://jimmybogard.com/automapper-usage-guidelines/) on how to use it. Why should copying values from one object to another need to be so complex?

# A Simple and Fast Object Mapper

I wrote an object mapper library that consists of a couple of interfaces and a handful of extension methods to make mapping objects slightly easier. The API is super simple and very light and thus fast. You can use the [Boxed.Mapping](https://www.nuget.org/packages/Boxed.Mapping/) NuGet package or look at the code at on GitHub in the [Dotnet-Boxed/Framework](https://github.com/Dotnet-Boxed/Framework) project. Lets look at an example. I want to map to and from instances of these two classes:

```cs
public class MapFrom
{
    public bool BooleanFrom { get; set; }
    public DateTimeOffset DateTimeOffsetFrom { get; set; }
    public int IntegerFrom { get; set; }
    public string StringFrom { get; set; }
}

public class MapTo
{
    public bool BooleanTo { get; set; }
    public DateTimeOffset DateTimeOffsetTo { get; set; }
    public int IntegerTo { get; set; }
    public string StringTo { get; set; }
}
```

The implementation for an object mapper using the .NET Boxed Mapper is shown below. Note the `IMapper` interface which is the heart of the .NET Boxed Mapper. There is also an `IAsyncMapper` if for any reason you need to map between two objects asynchronously, the only difference being that it returns a `Task`.

```cs
public class DemoMapper : IMapper
{
    public void Map(MapFrom source, MapTo destination)
    {
        destination.BooleanTo = source.BooleanFrom;
        destination.DateTimeOffsetTo = source.DateTimeOffsetFrom;
        destination.IntegerTo = source.IntegerFrom;
        destination.StringTo = source.StringFrom;
    }
}
```

And here is an example of how you would actually map a single object, array or list:

```cs
public class UsageExample
{
    private readonly IMapper mapper = new DemoMapper();
    
    public MapTo MapOneObject(MapFrom source) => this.mapper.Map(source);
    
    public MapTo[] MapArray(List source) => this.mapper.MapArray(source);
    
    public List MapList(List source) => this.mapper.MapList(source);
}
```

I told you it was simple! Just a few convenience extension methods bundled together with an interface that makes it just ever so slightly quicker to write object mapping than rolling your own implementation. If you have more complex mappings, you can compose your mappers in the same way that your models are composed.

# Performance

Keeping things simple makes the .NET Boxed Mapper fast. I put together some benchmarks using [Benchmark.NET](https://github.com/dotnet/BenchmarkDotNet) which you can find [here](https://github.com/Dotnet-Boxed/Framework/tree/master/Benchmarks/Boxed.Mapping.Benchmark). The baseline is hand written mapping code and I compare that to Automapper and the .NET Boxed Mapper.

I even got [a bit of help from the great Jon Skeet himself](https://stackoverflow.com/questions/46500630/how-to-improve-performance-of-c-sharp-object-mapping-code) on how to improve the performance of instantiating an instance when using the generic new() constraint which it turns out is pretty slow because it uses `Activator.CreateInstance` under the hood.

## Object to Object Mapping Benchmark

This benchmark measures the time taken to map from a `MapFrom` object to the `MapTo` object which I show above.

![Simple object to object mapping benchmark](./images/Boxed.Mapping-Object-Benchmark-1024x1024.png)

| Method       | Runtime |       Mean | Ratio | Gen 0/1k Op | Allocated Memory/Op |
|--------------|---------|-----------:|------:|------------:|--------------------:|
| Baseline     | Clr     |   7.877 ns |  1.00 |      0.0178 |                56 B |
| BoxedMapper  | Clr     |  25.431 ns |  3.07 |      0.0178 |                56 B |
| Automapper   | Clr     | 264.934 ns | 31.97 |      0.0277 |                88 B |
| Baseline     | Core    |   9.327 ns |  1.00 |      0.0178 |                56 B |
| BoxedMapper  | Core    |  17.174 ns |  1.84 |      0.0178 |                56 B |
| Automapper   | Core    | 158.218 ns | 16.97 |      0.0279 |                88 B |

## List Mapping Benchmark

This benchmark measures the time taken to map a List of `MapFrom` objects to a list of `MapTo` objects.

![List to list mapping benchmark](./images/Boxed.Mapping-List-Benchmark-1024x1024.png)

| Method      | Runtime |      Mean | Ratio | Gen 0/1k Op | Allocated Memory/Op |
|-------------|---------|----------:|------:|------------:|--------------------:|
| Baseline    | Clr     |  1.833 us |  1.00 |      2.0542 |             6.31 KB |
| BoxedMapper | Clr     |  3.295 us |  1.80 |      2.0523 |             6.31 KB |
| Automapper  | Clr     | 10.569 us |  5.77 |      2.4872 |             7.65 KB |
| Baseline    | Core    |  1.735 us |  1.00 |      2.0542 |             6.31 KB |
| BoxedMapper | Core    |  2.237 us |  1.29 |      2.0523 |             6.31 KB |
| Automapper  | Core    |  3.220 us |  1.86 |      2.4872 |             7.65 KB |

## Speed

It turns out that Automapper does a really good job on .NET Core in terms of speed but is quite a bit slower on .NET Framework. This is probably down to the intrinsic improvements in .NET Core itself. .NET Boxed is quite a bit faster than Automapper on .NET Framework but the difference on .NET Core is much less at around one and a half times. The .NET Boxed Mapper is also very close to the baseline but is a bit slower. I believe that this is due to the use of method calls on interfaces, whereas the baseline mapping code is only using method calls on concrete classes.

## Zero Allocations

.NET Boxed has zero allocations of memory while Automapper allocates a small amount per mapping. Since object mapping is a fairly common operation these small differences can add up over time and cause pauses in the app while the garbage collector cleans up the memory. There seems to be a trend I've seen in .NET for having zero allocation code. If you care about that, then this might help.

# Conclusions

What I've tried to do with the .NET Boxed Mapper is fill a niche which I thought that Automapper was not quite filling. A super simple and fast object mapper that's just a couple of interfaces and extension methods to help you along the way and provide a skeleton on which to hang your code. If Automapper fits your app better, go ahead and use that. If you think it's useful, you can use the [Boxed.Mapping](https://www.nuget.org/packages/Boxed.Mapping/) NuGet package or look at the code at on GitHub in the [Dotnet-Boxed/Framework](https://github.com/Dotnet-Boxed/Framework) project.
