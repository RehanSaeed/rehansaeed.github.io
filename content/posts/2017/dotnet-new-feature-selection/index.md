---
title: "dotnet new Feature Selection"
description: "How to add feature selection to your dotnet new template using symbols (bool, string, choice, computed) and pre-processor directives."
author: "Muhammad Rehan Saeed"
permalink: "/dotnet-new-feature-selection/"
heroImage: "/images/hero/Who-Wants-To-Be-A-Millionaire-1366x768.png"
date: "2017-03-26"
dateModified: null
published: true
categories:
  - "Tools"
tags:
  - ".NET"
  - ".NET Core"
  - "ASP.NET Core"
  - ".NET Boxed"
  - "C#"
  - "dotnet new"
---

- [Part 1 - Custom Project Templates Using dotnet new](/custom-project-templates-using-dotnet-new/)
- [Part 2 - dotnet new Feature Selection](/dotnet-new-feature-selection/)
- [Part 3 - Unit Testing dotnet new Templates](/unit-testing-dotnet-new-templates/)

In my last post I showed how to [get started](/custom-project-templates-using-dotnet-new/) with using `dotnet new` to build project templates. In this post, I'm going to build on that knowledge and show how to add feature selection to your project template so developers can choose to add or remove bits of your template. If you check out my [.NET Boxed API](https://github.com/Dotnet-Boxed/Templates) project template, you'll see that I have 17 features for you to set. If you run the help command against my template you'll see a description of each and instructions on how you can set them (I've cleaned up the CLI output, the current help commands output is pretty awful but this is being [addressed](https://github.com/dotnet/templating/issues/348) in the next version of `dotnet new`).

```
PS C:\Users\rehan.saeed> dotnet new api --help
Template Instantiation Commands for .NET Core CLI.

Usage: dotnet new [arguments] [options]

Arguments:
  template  The template to instantiate.

Options:
  -l|--list         List templates containing the specified name.
  -lang|--language  Specifies the language of the template to create
  -n|--name         The name for the output being created. If no name is specified, the name of the current directory is
used.
  -o|--output       Location to place the generated output.
  -h|--help         Displays help for this command.
  -all|--show-all   Shows all templates

.NET Boxed API (C#)
Author: Muhammad Rehan Saeed (RehanSaeed.com)
Options:
  -Ti|--Title: The name of the project which determines the assembly product name. If the Swagger feature is enabled,
    shows the title on the Swagger UI.
    string - Optional
    Default: Project Title
  -D|--Description: A description of the project which determines the assembly description. If the Swagger feature is
    enabled, shows the description on the Swagger UI.
    string - Optional
    Default: Project Description
  -Au|--Author: The name of the author of the project which determines the assembly author, company and copyright
    information.
    string - Optional
    Default: Project Author
  -Sw|--Swagger: Swagger is a format for describing the endpoints in your API. Swashbuckle is used to generate a
    Swagger document and to generate beautiful API documentation, including a UI to explore and test operations,
    directly from your routes, controllers and models.
    bool - Optional
    Default: true
  -T|--TargetFramework: Decide which version of the .NET Framework to target.
    .NET Core         - Run cross platform (on Windows, Mac and Linux). The framework is made up of NuGet packages
                        which can be shipped with the application so it is fully stand-alone.
    .NET Framework    - Gives you access to the full breadth of libraries available in .NET instead of the subset
                        available in .NET Core but requires it to be pre-installed.
    Both              - Target both .NET Core and .NET Framework.
    Default: Both
  -P|--PrimaryWebServer: The primary web server you want to use to host the site.
    Kestrel        - A web server for ASP.NET Core that is not intended to be internet facing as it has not been
                     security tested. IIS or NGINX should be placed in front as reverse proxy web servers.
    WebListener    - A Windows only web server. It gives you the option to take advantage of Windows specific
                     features, like Windows authentication, port sharing, HTTPS with SNI, HTTP/2 over TLS
                     (Windows 10), direct file transmission, and response caching WebSockets (Windows 8).
    Default: Kestrel
  -Re|--ReverseProxyWebServer: The internet facing reverse proxy web server you want to use in front ofthe primary
    web server to host the site.
    Internet Information Services (IIS) - A flexible, secure and manageable Web server for hosting anything on the
                                          Web using Windows Server. Select this option if you are deploying your site
                                          to Azure web apps. IIS is preconfigured to set request limits for security.
    NGINX                               - A free, open-source, cross-platform high-performance HTTP server and
                                          reverse proxy, as well as an IMAP/POP3 proxy server. It does have a Windows
                                          version but its not very fast and IIS is better on that platform. If the
                                          HTTPS Everywhere feature is enabled, NGINX is pre-configured to enable the
                                          most secure TLS protocols and ciphers for security and to enable HTTP 2.0
                                          and SSL stapling for performance.
    Both                                - Support both reverse proxy web servers.
    Default: Both
  -C|--CloudProvider: Select which cloud provider you are using if any, to add cloud specific features.
    Azure    - The Microsoft Azure cloud. Adds logging features that let you see logs in the Azure portal.
    None     - No cloud provider is being used.
    Default: None
  -A|--Analytics: Monitor internal information about how your application is running, as well as external user
    information.
    Application Insights    - Monitor internal information about how your application is running, as well as
                              external user information using the Microsoft Azure cloud.
    None                    - Not using any analytics.
    Default: None
  -Ap|--ApplicationInsightsInstrumentationKey: Your Application Insights instrumentation key
    e.g. 11111111-2222-3333-4444-555555555555.
    string - Optional
    Default: APPLICATION-INSIGHTS-INSTRUMENTATION-KEY
  -H|--HttpsEverywhere: Use the HTTPS scheme and TLS security across the entire site, redirects HTTP to HTTPS and
    adds a Strict Transport Security (HSTS) HTTP header with preloading enabled. Configures the primary and reverse
    proxy web servers for best security and adds a development certificate file for use in your development environment.
    bool - Optional
    Default: true
  -Pu|--PublicKeyPinning: Adds the Public-Key-Pins (HPKP) HTTP header to responses. It stops man-in-the-middle
    attacks by telling browsers exactly which TLS certificate you expect. You must have two TLS certificates for this
    to work, if you get this wrong you will have performed a denial of service attack on yourself.
    bool - Optional
    Default: false
  -CO|--CORS: Browser security prevents a web page from making AJAX requests to another domain. This restriction is
    called the same-origin policy, and prevents a malicious site from reading sensitive data from another site.
    CORS is a W3C standard that allows a server to relax the same-origin policy. Using CORS, a server can explicitly
    allow some cross-origin requests while rejecting others.
    bool - Optional
    Default: true
  -X|--XmlFormatter: Choose whether to use the XML input/output formatter and which serializer to use.
    DataContractSerializer - The default XML serializer you should use. Requires the use of [DataContract] and
                             [DataMember] attributes.
    XmlSerializer          - The alternative XML serializer which is slower but gives more control. Uses the
                             [XmlRoot], [XmlElement] and [XmlAttribute] attributes.
    None                   - No XML formatter.
    Default: None
  -S|--StatusController: An endpoint that returns the status of this API and its dependencies, giving an indication
    of its health. This endpoint can be called by site monitoring tools which ping the site or by load balancers
    which can remove an instance of this API if it is not functioning correctly.
    bool - Optional
    Default: true
  -R|--RequestId: Require that all requests send the X-Request-ID HTTP header containing a GUID. This is useful where
    you have access to the client and server logs and want to correlate a request and response between the two.
    bool - Optional
    Default: false
  -U|--UserAgent: Require that all requests send the User-Agent HTTP header containing the application name and
    version of the caller.
    bool - Optional
    Default: false
  -Ro|--RobotsTxt: Adds a robots.txt file to tell search engines not to index this site.
    bool - Optional
    Default: true
  -Hu|--HumansTxt: Adds a humans.txt file where you can tell the world who wrote the application. This file is a good
    place to thank your developers.
    bool - Optional
    Default: true
```

As you can see from the output, there are a few different types of feature you can create. You can also choose to make a feature required or optional. An optional feature, if not specified by the user will fall-back to a default value. Here are the different types available:

- **bool** - This feature can be turned on or off and has a default of true or false.
- **string** - This can be used to do a string replacement in your template. It has a default value which you can set to any arbitrary value.
- **choice** - This is a feature with two or more named choices. Each choice can have it's own description. The default value must be one of the choices.
- **computed** - These are features flags that can be computed based on other symbols.

# Bool Symbols

You can create a boolean feature by adding symbols section to your `template.json` file. If you look at the example below, I've specified an optional bool symbol, with a default value of true.

```json
{
  ...
  "symbols": {
    "Swagger": {
      "type": "parameter",
      "datatype": "bool",
      "isRequired": false,
      "defaultValue": "true",
      "description": "Your description..."
    }
  }
}
```

In your code, you can then use the symbol name, in this case `Swagger` as a pre-processor directive in C# code:

```cs
#if (Swagger)
Console.WriteLine("Swagger feature was selected");
#else
Console.WriteLine("Swagger feature was not selected");
#endif
```

This is really cool because you can still run the application as a template author and the project will still work. If you define a `Swagger` constant in your project properties, your feature will turn on or off too. This makes debugging your project template very easy as a template author.

If you want to use the symbol in files other than C# where pre-processor directives do not exist, you can use the comment syntax specific to that file extension, so in a JavaScript file would use the `//` syntax:

```cs
//#if (Swagger)
console.log('Swagger feature was selected');
//#else
console.log('Swagger feature was not selected');
//#endif
```

Most file extensions that have their own comment syntax have been catered for. For text files where there is no comment syntax or for any file extension that the templating engine doesn't know about you can use the `#` character:

```cs
#if (Swagger)
Swagger feature was selected
#else
Swagger feature was not selected
#endif
```

You can look at [this](https://github.com/dotnet/templating/blob/cb9edbfe02c038a306fbcb6bbe162462d5fb59f0/src/Microsoft.TemplateEngine.Orchestrator.RunnableProjects/Config/ConditionalConfig.cs) code in the templating engine for a full list of supported file extensions and comment types.

# String Symbols

String symbols can be used to do simple file replace operations.

```json
{
  ...
  "symbols": {
    "Title": {
      "type": "parameter",
      "datatype": "string",
      "isRequired": false,
      "defaultValue": "Default Project Title",
      "replaces": "PROJECT-TITLE",
      "description": "Your description..."
    }
  }
}
```

The above symbol looks for a `PROJECT-TITLE` string and replaces it with whatever the user specifies or with the default value `Default Project Title` if the user doesn't set anything.

# Choice Symbols

A choice symbol is useful when you have more than two options and can't use bool.

```json
{
  ...
  "symbols": {
    "TargetFramework": {
      "type": "parameter",
      "datatype": "choice",
      "isRequired": false,
      "choices": [
        {
          "choice": ".NET Core",
          "description": "Your description..."
        },
        {
          "choice": ".NET Framework",
          "description": "Your description..."
        },
        {
          "choice": "Both",
          "description": "Your description..."
        }
      ],
      "defaultValue": "Both",
      "description": "Your description..."
    }
}
```

In the example above, you have the choice of selecting a target framework, with a value of `.NET Core`, `.NET Framework` or `Both`. Each choice has it's own description and the overall symbol also has it's description.

# Computed Symbols

In the above example, you can't use the value '.NET Core' as a C# pre-processor variable because it contains a dot and a space. This is where a computed symbol comes in handy.

```json
{
  ...
  "symbols": {
   "NETCore": {
      "type": "computed",
      "value": "(TargetFramework == \".NET Core\" || TargetFramework == \"Both\")"
    },
    "NETFramework": {
      "type": "computed",
      "value": "(TargetFramework == \".NET Framework\" || TargetFramework == \"Both\")"
    }
  }
}
```

Here I have set up two computed symbols which determines whether '.NET Core' or '.NET Framework' was selected individually in the previous choice symbol. I have named these symbols without a dot or space i.e. `NETCore` and `NETFramework` so I can use these as C# pre-processor symbols, the same way I showed above.

# Conditionally Deleting Files or Folders

You can also use symbols to delete certain files or folders. In this example, I've extended my bool symbol example to additionally remove two files and a folder if the feature is deselected by the user.

```json
{
  ...
  "symbols": {
    "Swagger": {
      "type": "parameter",
      "datatype": "bool",
      "isRequired": false,
      "defaultValue": "true",
      "description": "Your description..."
    }
  },
  "sources": [
    {
      "modifiers": [
        {
          "condition": "(!Swagger)",
          "exclude": [
            "Constants/HomeControllerRoute.cs",
            "Controllers/HomeController.cs",
            "ViewModelSchemaFilters/**/*"
          ]
        }
      ]
    }
  ]
}
```

You do this by adding source modifiers. I've added one here with a condition and three file and folder exclusions. The exclusions use a globbing pattern.

# What's Next?

There are several other useful features of the templating engine which I'll cover in a follow up post as this is starting to get quite long. Feel free to take a look at the [source code](https://github.com/Dotnet-Boxed/Templates) for my API template to see a full example.
