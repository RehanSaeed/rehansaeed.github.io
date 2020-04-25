---
title: "Optimally Configuring Entity Framework Core"
description: "How to optimally configure your Entity Framework Core DbContext for best performance, resiliency and easy debugging for the developer."
author: "Muhammad Rehan Saeed"
permalink: "/optimally-configuring-entity-framework-core/"
heroImage: "/images/hero/NET-1366x768.png"
heroImageAlt: ".NET"
date: "2018-07-08"
dateModified: null
published: true
categories:
  - "Entity Framework Core"
tags:
  - "Connection Strings"
  - "Entity Framework Core"
  - "Microsoft SQL Server"
---

Lets talk about configuring your Entity Framework Core `DbContext` for a moment. There are several options you might want to consider turning on. This is how I configure mine in most micro services:

```cs
public virtual void ConfigureServices(IServiceCollection services) =>
    services.AddDbContextPool<MyDbContext>(
        options => options
            .UseSqlServer(
                this.databaseSettings.ConnectionString,
                x => x.EnableRetryOnFailure())
            .ConfigureWarnings(x => x.Throw(RelationalEventId.QueryClientEvaluationWarning))
            .EnableSensitiveDataLogging(this.hostingEnvironment.IsDevelopment())
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking))
    ...
```

# EnableRetryOnFailure

[EnableRetryOnFailure](https://docs.microsoft.com/en-us/ef/core/miscellaneous/connection-resiliency) enables retries for transient exceptions. So what is a transient exception? Entity Framework Core has a `SqlServerTransientExceptionDetector` class that defines that. It turns out that any SqlException with a very specific list of SQL error codes or `TimeoutExceptions` are considered transient exceptions and thus, safe to retry.

# ConfigureWarnings

By default, Entity Framework Core will log warnings when it can't translate your C# LINQ code to SQL and it will evaluate parts of your LINQ query it does not understand in-memory. This is usually catastrophic for performance because this usually means that EF Core will retrieve a huge amount of data from the database and then filter it down in-memory.

Luckily in EF Core 2.1, they added support to translate the `GroupBy` LINQ method to SQL. However, I found out yesterday that you have to write Where clauses after `GroupBy` for this to work. If you write the Where clause before your `GroupBy`, EF Core will evaluate your `GroupBy` in-memory in the client instead of in SQL. The key is to know when this is happening.

One thing you can do is throw an exception when you are evaluating a query in-memory instead of in SQL. That is what Throw on `QueryClientEvaluationWarning` is doing.

# EnableSensitiveDataLogging

[EnableSensitiveDataLogging](https://docs.microsoft.com/en-us/dotnet/api/microsoft.entityframeworkcore.dbcontextoptionsbuilder.enablesensitivedatalogging?view=efcore-2.1) enables application data to be included in exception messages. This can include SQL, secrets and other sensitive information, so I am only doing it when running in the development environment. It's useful to see warnings and errors coming from Entity Framework Core in the console window when I am debugging my application using the Kestrel webserver directly, instead of with IIS Express.

# UseQueryTrackingBehavior

If you are building an ASP.NET Core API, each request creates a new instance of your DbContext and then this is disposed at the end of the request. Query tracking keeps track of entities in memory for the lifetime of your DbContext so that if they are updated any changes can be saved, this is a waste of resources if you are just going to throw away the `DbContext` at the end of the request. By passing NoTracking to the [UseQueryTrackingBehavior](https://docs.microsoft.com/en-us/ef/core/querying/tracking#no-tracking-queries) method, you can turn off this default behaviour. Note that if you are performing updates to your entities, don't use this option, this is only for API's that perform reads and/or inserts.

# Connection Strings

You can also pass certain settings to connection strings. These are specific to the database you are using, here I'm talking about SQL Server. Here is an example of a connection string:

> Data Source=localhost;Initial Catalog=MyDatabase;Integrated Security=True;Min Pool Size=3;Application Name=MyApplication

## Application Name

SQL Server can log or profile queries that are running through it. If you set the application name, you can more easily identify the applications that may be causing problems in your database with slow or failing queries.

## Min Pool Size

Creating database connections is an expensive process that takes time. You can specify that you want a minimum pool of connections that should be created and kept open for the lifetime of the application. These are then reused for each database call. Ideally, you need to performance test with different values and see what works for you. Failing that you need to know how many concurrent connections you want to support at any one time.

# The End...

It took me a while to craft this setup, I hope you find it useful. You can find out more by reading the excellent Entity Framework Core [docs](https://docs.microsoft.com/en-us/ef/core/miscellaneous/configuring-dbcontext).
