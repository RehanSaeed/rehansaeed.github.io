---
title: "Securing the ASP.NET MVC Web.config"
description: "The web.config file is insecure in the default ASP.NET MVC project template. This post talks you through securing the ASP.NET MVC Web.config file."
author: "Muhammad Rehan Saeed"
permalink: "/securing-the-aspnet-mvc-web-config/"
cover_image: "/images/hero/ASP.NET-Core-Boilerplate-1366x768.png"
date: "2014-12-17"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET MVC"
  - "ASP.NET Core Boilerplate"
  - "C#"
  - "GitHub"
  - "HTTP Headers"
  - "Project Template"
  - "Security"
  - "Visual Studio"
  - "Web.config"
---

- [ASP.NET Core Boilerplate](/asp-net-mvc-boilerplate/)
- Security
    - [Securing the ASP.NET MVC Web.config (Updated)](/securing-the-aspnet-mvc-web-config/)
    - [NWebSec ASP.NET MVC Security Through HTTP Headers](/nwebsec-asp-net-mvc-security-through-http-headers/)
    - [Content Security Policy (CSP) for ASP.NET MVC](/content-security-policy-for-asp-net-mvc/)
- Search Engine Optimization (SEO)
    - [Canonical URL's for ASP.NET MVC](/canonical-urls-for-asp-net-mvc/)
    - [Dynamically Generating Robots.txt Using ASP.NET MVC](/dynamically-generating-robots-txt-using-asp-net-mvc)
- [Internet Favicon Madness (Updated)](/internet-favicon-madness/)
- [Building RSS/Atom Feeds for ASP.NET MVC](/building-rssatom-feeds-for-asp-net-mvc/)

Security is a big subject in the web world. Largely because it's super easy to leave your site insecure and open to attack. The default ASP.NET MVC project template is pretty weak when it comes to security. It trades security for simplicity. The [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) project template, shifts that balance more in favour of security while still trying to be as simple as possible. Several insecure settings in the Web.config file have been changed and made secure by default.

This series of blog posts goes through the additions made to the default ASP.NET MVC template to build the [ASP.NET Core Boilerplate](https://github.com/Dotnet-Boxed/Templates) project template. You can create a new project using this template by installing the [Visual Studio template extension](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) or visit the [GitHub](https://github.com/Dotnet-Boxed/Templates) site to view the source code.

# Securing Web.config

## Turn On Custom Errors

In the early stages of development, you want to see the full stack trace of your exceptions when an error occurs on a page. When it comes to releasing your site, you need to hide this sensitive information. Unbelievably, the default ASP.NET MVC template leaves this sensitive information wide open. To hide this, you need to add the [customErrors](http://msdn.microsoft.com/en-us/library/vstudio/h0hfz6fc%28v=vs.100%29.aspx) section to your web.config file and turn it on.

The problem is that we still want this setting to be turned off when debugging. This is where [configuration file transforms](http://go.microsoft.com/fwlink/?LinkId=301874) come in. This setting is off when the solution configuration is 'Debug' and on when it is 'Release'. The debug attribute in the compilation section is set in the same way.

## Securing Cookies

By default JavaScript from external sites can access the cookies from the default ASP.NET MVC template. They can also be sent unencrypted over the wire, because they don't use SSL. The [httpCookies](http://msdn.microsoft.com/en-us/library/vstudio/ms228262%28v=vs.100%29.aspx) section can be added to secure your cookies (This can also be done in code but the point is that we are making it secure by default. You could easily forget to turn this on in code).

```xml
<!-- httpOnlyCookies - Ensure that external script cannot access the cookie. -->
<!-- requireSSL - Ensure that the cookie can only be transported over SSL. -->
<httpCookies httpOnlyCookies="true" requireSSL="false" />
```

By default we set `requireSSL` to false because we don't know if you are going to use SSL in your site or not. If you are using SSL, you need to turn this on.

## Shut ASP.NET's Mouth

By default ASP.NET shouts about itself a lot. It sends HTTP headers with each response telling the world and dog what version of ASP.NET your site is hosted on and even what version of MVC you are using. Below is an example of the extra headers needlessly being sent with every request:

![ASP.NET Response Headers](./images/ASPNET-Response-Headers.png)

To fix this problem you need to do a few things. The first is to set the `enableVersionHeader` setting on the `httpRuntime` section to false.

```xml
<!-- enableVersionHeader - Remove the ASP.NET version number from the response headers. Added security through obscurity. -->
<httpRuntime targetFramework="4.5" enableVersionHeader="false" />
```

Second, you need to clear the custom headers as shown below.

```xml
<httpProtocol>
  <customHeaders>
    <!-- X-Powered-By - Remove the HTTP header for added security and a slight performance increase. -->
    <clear />
  </customHeaders>
</httpProtocol>
```

[Troy Hunt](http://www.troyhunt.com/2012/02/shhh-dont-let-your-response-headers.html) is a great MVC security guru and definitely worth a read on this subject.

## ASP.NET Session Cookie

We rename the ASP.NET session cookie from its default name of `ASP.NET_SessionId` to `s`. Now, users of our site, no longer have any idea what web server we are using (There are still ways to find out but we are making it harder) and we save a few more bytes being sent over the wire because we have a shorter name.

```xml
<!-- cookieName - Sets the name of the ASP.NET session cookie (Defaults to 'ASP.NET_SessionId'). -->
<sessionState cookieName="s" />
```

## Maximum URL Request Length

By default, ASP.NET MVC allows 4096 characters in the request URL. This is to reduce the effects of denial of service attacks. You can reduce this limit further by setting the `maxRequestLength` setting on the `httpRuntime` section. The template does not do this by default but does include a comment highlighting this.

```xml
<!-- maxRequestLength="4096" - The maximum length of the url request in kilobytes. -->
<httpRuntime maxRequestLength="4096"/>
```

## Machine Keys

Machine keys are used by MVC to generate anti-forgery tokens, which you should be using with any form on your site. If your site is deployed to a server cluster, you need to generate a machine key and add it to the system.web section of your web.config file. This is to ensure that both machines in your server cluster are using the same machine key to generate anti-forgery tokens. [This](http://blogs.msdn.com/b/amb/archive/2012/07/31/easiest-way-to-generate-machinekey.aspx) link tells you more about how to do this.

```xml
<machineKey decryptionKey="[YOUR DECRYPTION KEY GOES HERE]" validationKey="[YOUR VALIDATION KEY GOES HERE]"/>
```

## Securing Third Party Plugins

The popular [Elmah](https://code.google.com/p/elmah/) NuGet package is included and configured for error logging out of the box. However, to properly secure it, you should change the URL pointing to it (An attacker can only probe your Elmah page for vulnerabilities if they can find it). You should also use some form of authentication to limit the Elmah page to certain roles or users. Both of these steps can only be taken by the person using the template. However, where we can't write the code for you, we add liberal comments and add an entry into the check-list so you don't forget to do this. By default we also allow remote access to the Elmah pages, consider turning this off if you have local access to machine the site is hosted on. Here are the relevant app settings:

```xml
<!-- In case of authentication is turned on, you can specify exact roles of user that have access (eg. "Administrator"). -->
<add key="elmah.mvc.allowedRoles" value="*" />
<!-- In case of authentication is turned on, you can specify exact users that have access (eg. "johndoe"). -->
<add key="elmah.mvc.allowedUsers" value="*" />
<!-- Configure ELMAH.MVC access route. Note that you should probably change this to something else. 
     This is to add a little security through obscurity. hackers can't hack your elmah page if they 
     don't know where it is. -->
<add key="elmah.mvc.route" value="elmah" />
```

[Glimpse](http://getglimpse.com/) is another great tool to help with debugging and diagnostics for your site. Like Elmah, Glimpse has it's own URL which you should rename. Glimpse is turned off in 'Release' mode for security reasons but you could keep it turned on and use authentication to limit who can access it. The relevant section for Glimpse is shown below.

```xml
<!-- glimpse - Navigate to {your site}/glimpse and turn on Glimpse to see detailed information about your site.
               (See http://getglimpse.com/ for a video about how this helps with debugging).
               You can also install addons for Glimpse to see even more information. E.g. Install the Glimpse.EF6
               NuGet package to see your SQL being executed (See http://getglimpse.com/Extensions for all Glimpse extensions).
               For more information on how to configure Glimpse, please visit http://getglimpse.com/Help/Configuration
               or access {your site}/glimpse for even more details and a Configuration Tool to support you. 
               Note: To change the glimpse URL, change the value in endpointBaseUri and also the glimpse URL under 
               httpHandlers and handlers sections above. -->
<glimpse defaultRuntimePolicy="On" endpointBaseUri="~/glimpse">
</glimpse>
```

# Securing Anti-Forgery Tokens

I'm not quite sure why but configuring the ASP.NET MVC anti-forgery tokens cannot be done in the `web.config` file. The following code can be found in the `Global.asax.cs` file.

```cs
private static void ConfigureAntiForgeryTokens()
{
    // Rename the Anti-Forgery cookie from "__RequestVerificationToken" to "f". 
    // This adds a little security through obscurity and also saves sending a 
    // few characters over the wire.
    AntiForgeryConfig.CookieName = "f";

    // If you have enabled SSL. Uncomment this line to ensure that the Anti-Forgery 
    // cookie requires SSL to be sent accross the wire. 
    // AntiForgeryConfig.RequireSsl = true;
}
```

We are renaming the anti-forgery cookie from `__RequestVerificationToken` to `f`. This saves a few bytes and obscures the technology we are using a little. You can also require SSL for the anti-forgery cookie to be sent over the wire. This is commented out by default but if you are using SSL, set this to true for added security.

# (UPDATE) Removing Tracing

Enabling [tracing](https://msdn.microsoft.com/en-us/library/ms972204.aspx) while debugging your site is a fairly common occurrence. It can be done with a single line of config:

```xml
<system.web>
  <trace enabled="true"/>
</system.web>
```

Your tracing information can be easily views by navigating to `http://YourSite/trace.axd` as shown here:

![ASP.NET Tracing Trace.axd Page](./images/Trace.axd_.png)

The security angle on tracing is two-fold. First is the most obvious, you could leave the trace.axd page open to anyone who knows to try that URL on your site. Thus, leaking valuable inside information about your site, as well as the version of ASP.NET and .NET you are using. The fix for this is simple, you just need to remember to remove the tracing node from your `web.config` file.

Once again, you can use [configuration file transforms](http://go.microsoft.com/fwlink/?LinkId=301874) to fix this problem. In your `Web.Release.config` file, you can add the following code to remove tracing but only when the site is built in release mode:

```xml
<system.web>
  <!-- customErrors - Turn on custom error pages instead of ASP.NET errors containing stack traces which are a security risk. -->
  <customErrors xdt:Transform="SetAttributes(mode)" mode="On"/>
  <!-- compilation - Turn off debug compilation. -->
  <compilation xdt:Transform="RemoveAttributes(debug)" />
  <!-- trace - Turn off tracing, just in case it is turned on for debugging. -->
  <trace xdt:Transform="Remove" />
</system.web>
```

The second problem is that even if you do this, accessing `http://YourSite/trace.axd` causes a 500 Internal Server Error on your site! This gives an attacker a clue that you are using ASP.NET. The correct thing to do is for the site to respond with a 404 Not Found error page instead. It turns out that in release mode you have to remove the tracing [HTTP handlers](https://msdn.microsoft.com/en-us/library/bb398986%28v=vs.140%29.aspx) altogether to stop your site responding to this URL. You can do that by adding the following snippet to the `Web.Release.config` file:

```xml
<system.webServer>
  <!-- remove TraceHandler-Integrated - Remove the tracing handlers so that navigating to /trace.axd gives us a 
       404 Not Found instead of 500 Internal Server Error. -->
  <handlers>
    <remove xdt:Transform="Insert" name="TraceHandler-Integrated" />
    <remove xdt:Transform="Insert" name="TraceHandler-Integrated-4.0" />
  </handlers>
</system.webServer>
```

# (UPDATE) 403.14 Forbidden Responses to Directories

Navigating to a directory using IIS and ASP.NET MVC can cause a 403 Forbidden response to be returned. Actually, its a 403.**14** Forbidden response to be exact. IIS is basically telling us that [directory browsing](http://www.iis.net/configreference/system.webserver/directorybrowse) is disabled (As it should be, directory browsing is a severe security risk. It can allow attackers to see your Web.config file with all your connection strings in it!). You can see what happens when I navigate to the physical `/Content` folder below:

![403.14 Forbidden Response](./images/403.14-Forbidden-Response.png)

So what is the problem? Well, a user would expect a 404 Not Found response if a resource is not found. A 403.14 Forbidden response tells a potential attacker that there is a folder there and that you are using IIS. Not the most useful information to an attacker but combine it with other information and it could be useful. The way to fix this is to handle 403.14 errors and replace the response with a standard 404 Not Found. We just need to add the code below:

```xml
<system.webServer>
  <!-- Custom error pages -->
  <httpErrors errorMode="Custom" existingResponse="Replace">
    <!-- Redirect IIS 403.14 Forbidden responses to the error controllers not found action.
         A 403.14 happens when navigating to an empty folder like /Content and directory browsing is turned off
         See http://www.troyhunt.com/2014/09/solving-tyranny-of-http-403-responses.html -->
    <error statusCode="403" subStatusCode="14" responseMode="ExecuteURL" path="/error/notfound" />
    <!-- ...Ommitted Code... -->
  </httpErrors>
</system.webServer>
```

Just adding this is not enough however. If I fire up [Fiddler](http://www.telerik.com/fiddler) Navigating to the `/Content` folder of the site now results in a 301 Document Moved response, followed by a 404 Not Found. We can do much better than that.

![Fiddler 301 Courtesy Redirect](./images/301-Courtesy-Redirect.png)

To get around the above issue, you need to turn off [default document handling](http://www.iis.net/configreference/system.webserver/defaultdocument) in IIS. Please do note, that this will stop IIS from returning the default document (Using whats called a courtesy redirect) when navigating to a folder e.g. navigating to `/Folder` which contains an `index.html` file will not return `/Folder/index.html`. This should not be a problem as we are using ASP.NET MVC controllers and actions and not physical files.

```xml
<system.webServer>
  <!-- Stop IIS from doing courtesy redirects used to redirect a link to a directory without
       to a slash to one with a slash e.g. /Content redirects to /Content/. This gives a clue
       to hackers as to the location of directories. -->
  <defaultDocument enabled="false"/>
</system.webServer>
```

Now, navigating to `/Content` will return us a simple and correct 404 Not Found and we don't have the courtesy redirect any-more too. Take a look at the same request in Fiddler:

![Fiddler 404 Not Found](./images/Fiddler-404-Not-Found.png)

# Conclusions

IIS seems to have a lot of strange behaviours that have a detrimental effect on security. If you use the above settings however, you can cut out IIS's extra features that you don't need or want. Look out for the next post when I'll be discussing the very cool [NWebSec](https://github.com/NWebsec/NWebsec) NuGet package, which provides a whole host of comprehensive ASP.NET MVC security related filters which you can apply to your site.
