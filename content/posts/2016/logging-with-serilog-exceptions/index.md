---
title: "Logging with Serilog.Exceptions"
description: "Log exception details and custom properties that are not output in Exception.ToString() using Serilog.Exceptions for .NET."
author: "Muhammad Rehan Saeed"
permalink: "/logging-with-serilog-exceptions/"
cover_image: "/images/hero/Serilog.Exceptions-1366x768.png"
date: "2016-01-31"
dateModified: null
published: true
categories:
  - "Base Class Library (BCL)"
tags:
  - ".NET"
  - "Base Class Library"
  - "BCL"
  - "C#"
  - "GitHub"
  - "NuGet"
  - "Serilog"
  - "Serilog.Exceptions"
---

Picking a logging framework for your new .NET project? I've tried all the best known ones, including [log4net](https://logging.apache.org/log4net/), [NLog](http://nlog-project.org/) and Microsoft's [Logging Application Block](https://msdn.microsoft.com/en-us/library/ff647183.aspx). All of these logging frameworks basically output plain text but recently I tried [Serilog](http://serilog.net/) and was literally blown away by what you could do with it.

# Logging in JSON Format

Take a look at the code below which makes use of the Serilog logger to log a geo-coordinate and an integer:

```cs
var position = new { Latitude = 25, Longitude = 134 };
var elapsedMs = 34;

log.Information("Processed {@Position} in {Elapsed:000} ms.", position, elapsedMs);
```

If you configure Serilog correctly, you can get it to output it's logs to JSON format, so the above line would log the following:

```json
{
  "Timestamp": "2015-12-07T12:26:24.0557671+00:00",
  "Level": "Information",
  "MessageTemplate": "Processed {@Position} in {Elapsed:000} ms.",
  "RenderedMessage": "Processed { Latitude: 25, Longitude: 134 } in 034 ms.",
  "Properties": {
    "Position": 
    { 
        "Latitude": 25,
        "Longitude": 134
    }, 
    "Elapsed": 34,
    "ProcessId": 123,
    "ThreadId": 123,
    "User": "Domain\\Username",
    "Machine": "Machine-Name",
    "Source": "My Application Name"
  }
}
```

# Why JSON?

What can you do with JSON formatted logs that you can't do with plain text? Well, if you store all your logs in something like [Elastic Search](https://www.elastic.co/webinars/get-started-with-elasticsearch?elektra=home&storm=banner), you can query your logs and ask it questions. So if we take the above example further we could find all log messages from a particular machine or user with an elapsed time of more than 10 milliseconds and a distance of 10 Km away from the specific location.

Not only that but if you set up something like [Kibana](https://www.elastic.co/products/kibana), then you can create visualisations for your logs which could grow to be gigabytes in size over time. You can create dashboards with cool charts and maps that look something like this:

![Kibana Dashboard Screenshot](./images/Kibana-Screenshot.png)

# Logging Exceptions

One major problem with all exceptions is that they do not log all the properties of an exception and throw away vital information. Take the `DbEntityValidationException` from EntityFramework as an example. This exception contains vital information buried not in the message but in a custom property called `EntityValidationErrors`. The problem is that when you do an `exception.ToString()` call, this vital information is not included in the resulting string. Even worse, it's not included in the debugger either. This is a pretty major failing in the .NET framework but alas we have to work around it.

There are literally dozens of questions on [StackOverflow](https://stackoverflow.com/questions/15820505/dbentityvalidationexception-how-can-i-easily-tell-what-caused-the-error) asking how to deal with this problem and all the major logging frameworks fail in this regard. All of them call `exception.ToString()` and fail to log the `EntityValidationErrors` collection.

`DbEntityValidationException` is not the only culprit, half the exceptions in the .NET framework contain custom properties that are not logged. The `Exception` base class itself has a `Data` dictionary collection which is never logged either.

# Serilog.Exceptions

I wrote [Serilog.Exceptions](https://github.com/RehanSaeed/Serilog.Exceptions) to solve this problem. So what happens when you log a `DbEntityValidationException` using this NuGet package added to Serilog itself? Well take a look yourself:

```json
{
  "Timestamp": "2015-12-07T12:26:24.0557671+00:00",
  "Level": "Error",
  "MessageTemplate": "Hello World",
  "RenderedMessage": "Hello World",
  "Exception": "System.Data.Entity.Validation.DbEntityValidationException: Message",
  "Properties": {
    "ExceptionDetail": {
      "EntityValidationErrors": [
        {
          "Entry": null,
          "ValidationErrors": [
            {
              "PropertyName": "PropertyName",
              "ErrorMessage": "PropertyName is Required.",
              "Type": "System.Data.Entity.Validation.DbValidationError"
            }
          ],
          "IsValid": false,
          "Type": "System.Data.Entity.Validation.DbEntityValidationResult"
        }
      ],
      "Message": "Validation failed for one or more entities. See 'EntityValidationErrors' property for more details.",
      "Data": {},
      "InnerException": null,
      "TargetSite": null,
      "StackTrace": null,
      "HelpLink": null,
      "Source": null,
      "HResult": -2146232032,
      "Type": "System.Data.Entity.Validation.DbEntityValidationException"
    },
    "ProcessId": 123,
    "ThreadId": 123,
    "User": "Domain\\Username",
    "Machine": "Machine-Name",
    "Source": "My Application Name"
  }
}
```

It logs every single property of the exception and not only that but it drills down even further into the object hierarchy and logs that information too.

You're probably thinking it uses reflection right? Well...sometimes. This library has custom code to deal with extra properties on most common exception types and only falls back to using reflection to get the extra information if the exception is not supported by Serilog.Exceptions internally.

# Getting Started with Serilog.Exceptions

Add the Serilog.Exceptions NuGet package to your project using the NuGet Package Manager or run the following command in the Package Console Window:

```powershell
Install-Package Serilog.Exceptions
```

When setting up your logger, add the `WithExceptionDetails` line like so:

```cs
using Serilog;
using Serilog.Exceptions;

ILogger logger = new LoggerConfiguration()
    .Enrich.WithExceptionDetails()
    .WriteTo.Sink(new RollingFileSink(
        @"C:\logs",
        new JsonFormatter(renderMessage: true))
    .CreateLogger();
```

That's it, it's one line of code!
