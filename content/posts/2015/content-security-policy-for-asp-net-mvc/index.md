---
title: "Content Security Policy (CSP) for ASP.NET MVC"
description: "Content Security Policy (CSP) is a HTTP header which white-lists content the browser is allowed to load. This post discusses its application in ASP.NET MVC."
author: "Muhammad Rehan Saeed"
permalink: "/content-security-policy-for-asp-net-mvc/"
cover_image: "/images/hero/Content-Security-Policy-CSP-for-ASP.NET-MVC-1366x768.png"
date: "2015-03-17"
dateModified: null
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "ASP.NET"
  - "ASP.NET Core Boilerplate"
  - "C#"
  - "Content Security Policy"
  - "Cross Site Scripting"
  - "CSP"
  - "Fiddler"
  - "MVC"
  - "NWebSec"
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

This series of blog posts goes through the additions made to the default ASP.NET MVC template to build the ASP.NET Core Boilerplate project template. You can create a new project using this template by installing the Visual Studio template extension or visit the GitHub site to view the source code.

# What is CSP?

For a true in-depth look into CSP, I highly recommend reading [Mozilla](https://developer.mozilla.org/en-US/docs/Web/Security/CSP)'s documentation on the subject. It really is the best resource on the web. I will assume that you've read the documentation and will be going through a few examples below.

Content Security Policy or CSP is a great new HTTP header that controls where a web browser is allowed to load content from and the type of content it is allowed to load. It uses a white-list of allowed content and blocks anything not in the allowed list. It gives us very fine grained control and allows us to run our site in a sandbox in the users browser.

CSP is all about adding an extra layer of security to your site using a [Defence in Depth](http://en.wikipedia.org/wiki/Defense_in_depth_%28computing%29) strategy. It helps detect and mitigate [Cross Site Scripting (XSS)](https://www.owasp.org/index.php/Cross-site_Scripting_%28XSS%29) and various data injection attacks, such as [SQL Injection](https://www.owasp.org/index.php/SQL_Injection).

## Real World Example

So what does this look like in a web browser. Well, here is an example of a Content-Security-Policy HTTP header shown in Chrome. I used the [ASP.NET Core Boilerplate](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) Visual Studio project template to create a ASP.NET MVC project that has CSP applied, right out of the box.

![Content Security Policy HTTP Header](./images/Content-Security-Policy-HTTP-Header.png)

This is the HTTP header in the screenshot above. We'll discuss it in a lot more detail later in this post. Essentially it says, block everything, except scripts, images, fonts, Ajax requests and forms to or from my domain and also allow scripts from the Google and Microsoft CDN's.

```http
Content-Security-Policy: default-src 'none';
                         script-src 'self' ajax.googleapis.com ajax.aspnetcdn.com;
                         style-src 'self' 'unsafe-inline';
                         img-src 'self';
                         font-src 'self';
                         connect-src 'self';
                         form-action 'self';
                         report-uri /WebResource.axd?cspReport=true
```

So for example, you may only want to load CSS, JavaScript and Images from your own trusted domain(s) and block everything else. You also might want to block any use of third party plug-ins (Flash or Silverlight) or frames. Using this type of policy, the only way an attacker could compromise your site using an XSS attack, would be to somehow get a malicious script from your own domain served up on your pages in **separate script files** as in-line styles and scripts are not blocked by CSP by default (You can turn this off but I will go on to tell you why this is a bad idea later on).

```xml
<script src="http://evil.com/Script.js"></script>
```

With the above CSP HTTP header in place if an attacker did manage to inject the script above, browsers would throw CSP violation errors and the evil script would not be executed or even downloaded. You can see what that looks like in Chrome below.

![Content Security Policy Violation](./images/Content-Security-Policy-Violation.png)

Even better, the browser never even downloads the evil script in the first place. You can compare the two screen-shots of Fiddler below. The left side shows that the evil Script.js file was never even requested but a Content Security Policy violation was logged to the URL highlighted (I'll talk more about this later). The right side shows the site with no CSP policy in effect. The browser tries to download the evil Script.js file and as this is just demo and I haven't gone to the trouble of setting up an evil website, it can't be found and returns a 404 Not Found.

![Fiddler Content Security Policy Violation](./images/Fiddler-Content-Security-Policy-Violation.png)

![Fiddler No Content Security Policy Applied](./images/Fiddler-No-Content-Security-Policy-Applied.png)
 
## Content Security Policy Directives

There are a number of 'directives' that are used in the policy above. Mozilla has the full list of directives and how each is used [here](https://developer.mozilla.org/en-US/docs/Web/Security/CSP/CSP_policy_directives). Each directive controls access to a particular function in a web browser. I will not cover each one in details as they all work in the same way but I will cover the most important and unique directives below.

### The default-src Directive

The `default-src` directive lets us apply some default restrictions. For example if I specified the following CSP policy, it would allow all types of content from my sites domain, as well as TrustedSite.com.

```http
Content-Security-Policy: default-src 'self' TrustedSite.com
```

Now the above policy is pretty loose, it tells a browser it can load frames, Ajax requests, Web Sockets, fonts, images, audio, video, plug-ins, scripts and styles from both of those domains. It may well be that you don't use most of the things on that list. A much better policy would be to block everything by default and then only allow certain resources that you actually use as shown below.

```http
Content-Security-Policy: default-src 'none'; 
                         script-src TrustedSite.com; 
                         style-src 'self'; 
                         img-src 'self'; 
                         font-src 'self'; 
                         connect-src 'self'; 
                         form-action 'self'
```

You can see that `default-src` has been set to `none` which blocks everything by default. Then we add other directives that allow, scripts from TrustedSite.com and styles, images, fonts, Ajax request and form submissions to my sites domain. This is a lot more secure and restrictive but it does require you to think more carefully about your policy.

### The report-uri Directive

The `report-uri` directive is another special instruction. It gives the web browser a URL where it can post details of any violations to a CSP policy in JSON format. This is vitally important and allows us to find out about anyone trying to hack our site but probably much more likely, it allows us to find out about any resources that we have accidentally blocked because our policy was too restrictive and we did not do enough testing. In the example below, we are telling the browser to post CSP violation errors in JSON format to `WebResource.axd?cspReport=true`.

```http
Content-Security-Policy: default-src 'self'; report-uri /WebResource.axd?cspReport=true
```

If we take the evil script above and try to add it to our page with the above CSP policy, we get a CSP violation error and you can see the JSON sent to us by the Chrome browser below. Please do note that different browsers do sent errors which are slightly different. Some browsers and indeed versions of browsers give more information than others.

```json
{
    "csp-report": {
        "document-uri": "http://localhost:8080/",
        "referrer": "",
        "violated-directive": "default-src 'self'",
        "effective-directive": "script-src",
        "original-policy": "default-src 'self';report-uri /WebResource.axd?cspReport=true",
        "blocked-uri": "http://evil.com",
        "status-code": 200
    }
}
```

### The style-src Directive

As I've mentioned before in-line styles are not allowed when using CSP because there is a risk that an attacker could inject in-line styles into a compromised page. All styles must be referenced from external CSS files as shown below.

```xml
<link href="/Site.css" rel="stylesheet"/>
```

```xml
<style>
    p {
        font-size:12pt;
    }
</style>
```

There is an extension to this directive which allows inline styles but you should avoid it as it is unsafe. Indeed the setting you have to pass to the `style-src` directive is called `unsafe-inline`.

```http
style-src 'self' 'unsafe-inline'
```

### The script-src Directive

Just like the `style-src` directive, `script-src` directive causes inline scripts to be blocked by default due to the risk of XSS attacks. Apart from inline scripts the JavaScript [eval()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) function is also blocked by default.

Also just like the `script-src` directive, there is a way to enable inline scripts too which is also called `unsafe-inline`. There is also another extension called `unsafe-eval`, which allows access to the `eval` function. Once again these should be avoided and I have covered them here only because you should be wary of those who tell you to use them.

```http
script-src 'self' 'unsafe-inline' 'unsafe-eval'
```

## The Content-Security-Policy-Report-Only HTTP Header

CSP can be a pretty dangerous HTTP header if you have misconfigured it. Imagine a user visiting a site and wanting to view a YouTube video on your site but your CSP policy has blocked the video and all they see is a blank space where the video should be and no indication that something is wrong, unless they are clever enough to use the browser developer tools. That's a pretty poor user experience.

To combat this problem the W3C created the `Content-Security-Policy-Report-Only` HTTP header. This works just the same as `Content-Security-Policy` but it only reports violations of your policy and does not cause the browser to actually block anything.

# CSP for ASP.NET MVC

So you're sold on CSP and want to know how you can implement this great new HTTP header on your ASP.NET MVC website. Well, to get started all you need to do is install the [NWebsec.Mvc](https://www.nuget.org/packages/NWebsec.Mvc/) NuGet package.

[NWebsec](https://github.com/NWebsec/NWebsec) is a great collection of MVC filters which can be applied globally to all requests or to individual controllers or actions. NWebSec contains a series of MVC filters to support CSP but includes several other filters which I've already blogged about [here](/nwebsec-asp-net-mvc-security-through-http-headers/).

Here is the CSP policy I have applied to the [ASP.NET Core Boilerplate](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) site and the code which is used to create it. This policy is applied to all responses from the site.

```http
Content-Security-Policy: default-src 'none';
                         script-src 'self' ajax.googleapis.com ajax.aspnetcdn.com;
                         style-src 'self' 'unsafe-inline';
                         img-src 'self';
                         font-src 'self';
                         connect-src 'self';
                         form-action 'self';
                         report-uri /WebResource.axd?cspReport=true
```

```cs
// Content-Security-Policy - Add the Content-Security-Policy HTTP header to enable Content-Security-Policy.
GlobalFilters.Filters.Add(new CspAttribute());
// OR
// Content-Security-Policy-Report-Only - Add the Content-Security-Policy-Report-Only HTTP header to enable logging of 
//      violations without blocking them. This is good for testing CSP without enabling it.
//      To make use of this attribute, rename all the attributes below to their ReportOnlyAttribute versions e.g. CspDefaultSrcAttribute 
//      becomes CspDefaultSrcReportOnlyAttribute.
// GlobalFilters.Filters.Add(new CspReportOnlyAttribute());

// default-src - Sets a default source list for a number of directives. If the other directives below are not used 
//               then this is the default setting.
filters.Add(
    new CspDefaultSrcAttribute()
    {
        // Disallow everything from the same domain by default.
        None = true,
        // Allow everything from the same domain by default.
        // Self = true
    });

// connect-src - This directive restricts which URIs the protected resource can load using script interfaces 
//               (Ajax Calls and Web Sockets).
filters.Add(
    new CspConnectSrcAttribute()
    {
        // Allow AJAX and Web Sockets to example.com.
        // CustomSources = "example.com",
        // Allow all AJAX and Web Sockets calls from the same domain.
        Self = true
    });
// font-src - This directive restricts from where the protected resource can load fonts.
filters.Add(
    new CspFontSrcAttribute()
    {
        // Allow fonts from example.com.
        // CustomSources = "example.com",
        // Allow all fonts from the same domain.
        Self = true
    });
// form-action - This directive restricts which URLs can be used as the action of HTML form elements.
filters.Add(
    new CspFormActionAttribute()
    {
        // Allow forms to post back to example.com.
        // CustomSources = "example.com",
        // Allow forms to post back to the same domain.
        Self = true
    });
// img-src - This directive restricts from where the protected resource can load images.
filters.Add(
    new CspImgSrcAttribute()
    {
        // Allow images from example.com.
        // CustomSources = "example.com",
        // Allow images from the same domain.
        Self = true,
    });
// script-src - This directive restricts which scripts the protected resource can execute. 
//              The directive also controls other resources, such as XSLT style sheets, which can cause the user agent to execute script.
filters.Add(
    new CspScriptSrcAttribute()
    {
        // Allow scripts from the CDN's.
        CustomSources = string.Format("ajax.googleapis.com ajax.aspnetcdn.com"),
        // Allow scripts from the same domain.
        Self = true,
        // Allow the use of the eval() method to create code from strings. This is unsafe and can open your site up to XSS vulnerabilities.
        // UnsafeEval = true,
        // Allow inline JavaScript, this is unsafe and can open your site up to XSS vulnerabilities.
        // UnsafeInline = true
    });
// style-src - This directive restricts which styles the user applies to the protected resource.
filters.Add(
    new CspStyleSrcAttribute()
    {
        // Allow CSS from example.com
        // CustomSources = "example.com",
        // Allow CSS from the same domain.
        Self = true,
        // Allow inline CSS, this is unsafe and can open your site up to XSS vulnerabilities.
        // Note: This is currently enable because Modernizr does not support CSP and includes inline styles
        // in its JavaScript files. This is a security hold. If you don't want to use Modernizr, 
        // be sure to disable unsafe inline styles. For more information see:
        // http://stackoverflow.com/questions/26532234/modernizr-causes-content-security-policy-csp-violation-errors
        // https://github.com/Modernizr/Modernizr/pull/1263
        UnsafeInline = true
    });
```

Notice how there is one MVC filter for each CSP directive. This is actually a very elegant solution. Consider the fact that you may want the actions in a particular controller to be able to display YouTube videos, note that YouTube makes use of iFrames to embed videos and it's embed mark-up is shown below.

```html
<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/PGM_uBy99GA" frameborder="0" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
```

With the above CSP policy, the Chrome browser throws the following error.

![Content Security Policy Violation by YouTube iFrame](./images/Content-Security-Policy-Violation-by-YouTube-iFrame.png)

We need to add the `frame-src` and `child-src` directive which can be added to the specific controller. Note that the `child-src` directive is a CSP 2.0 directive and `frame-src` is deprecated in CSP 2.0 but we still need to add it for older browsers.

```cs
[CspChildSrc(CustomSources = "*.youtube.com")]
[CspFrameSrcAttribute(CustomSources = "*.youtube.com")]
public class HomeController : Controller
{
    // Action methods ommitted.
}
```

But what if we only want to allow a YouTube video to display for a single action rather, than all of the actions in a controller. Well its as simple as moving the attributes to the action, rather than the controller.

```cs
public class HomeController : Controller
{
    [CspChildSrc(CustomSources = "*.youtube.com")]
    [CspFrameSrcAttribute(CustomSources = "*.youtube.com")]
    public ActionResult Index()
    {
        // This view displays a YouTube Video.
        return this.View();
    }
}
```

Setting up the reporting of CSP violations is a bit more complicated. You need to add the `CspReportUriAttribute` MVC filter and add a special function in your `Global.asax.cs` file to actually handle a violation as shown below.

```cs
filters.Add(new CspReportUriAttribute() { EnableBuiltinHandler = true });

// Added to Global.asax.cs
protected void NWebsecHttpHeaderSecurityModule_CspViolationReported(object sender, CspViolationReportEventArgs e)
{
    CspViolationReport violationReport = e.ViolationReport;
    // Log the CSP violation here.
}
```

The `CspViolationReport` is a representation of the JSON CSP violation that the browser sends you. It contains several properties, which can tell you about the blocked URL, the violated directive, the user agent and a lot more. This is your opportunity to log this data in your preferred logging framework.

One final note, all of this code is available to view on GitHub [here](https://github.com/Dotnet-Boxed/Templates) and is part of the ASP.NET Core Boilerplate project template.

# Browser Support

CSP is a proper standard, you can read the W3C documentation [here](http://www.w3.org/TR/CSP/). According to the W3C at the time of writing, CSP is at [Candidate Recommentation](http://en.wikipedia.org/wiki/World_Wide_Web_Consortium#Candidate_Recommendation_.28CR.29), which is "a version of the standard that is more firm than the Working Draft" and "The standard document may change further, but at this point, significant features are mostly locked".

If you take a look at [CanIUse.com](http://caniuse.com/#search=CSP), you can see that FireFox 23+, Chrome 25+, Safari 7+ and Opera 15+ already support the official `Content-Security-Policy` HTTP header, while the next version of IE (Spartan or IE12, who knows what they'll name it?) will come with full support too.

A number of older browser versions supported CSP using the `X-Content-Security-Policy` or `X-WebKit-CSP` HTTP header (The `X-` is commonly used to add features to browsers which are not yet finalised) but these older implementations are buggy (Their use can mean content on your site gets blocked, even though you allowed it!) and should not be used.

# Content Security Policy (CSP) 2.0

There is currently an 'Editors Draft' of [CSP 2.0](https://w3c.github.io/webappsec/specs/content-security-policy/), written by the W3C standards body. It was published on 13 November 2014.

The intention of this version is to fill a few gaps and add a few new directives which allow control over web workers, embedded frames, application manifests, the HTML documents base URL, where forms can be posted and the types of plug-ins the browser can load. [NWebsec](https://github.com/NWebsec/NWebsec) supports most of these new directives already (except notably the plug-in types) and you can start using them today.

As well as these changes, CSP 2.0 also tries to address the pain points in using CSP and perhaps the reason for its slow take-up so far i.e. the inability to safely use in-line CSS and JavaScript using the style and script tags in your HTML.

So why would you want to use in-line styles and scripts in the first place? Well, do you use [Modernizr](http://modernizr.com/)? Yes, well Modernizr does not work with CSP (I discuss this below). It makes use of in-line styles to test for various web browser capabilities and so requires the `unsafe-inline` directive to function. There are other libraries that also have a similar requirement. Other reasons for using in-line styles and scripts are to use CSP on an existing web application, where you don't want to spend time moving to separate script files.

CSP 1.0 had the `unsafe-inline` directive which allowed the use of in-line style and script tags but it is pretty dangerous and makes CSP **partially** pointless. It gives attackers the ability to inject code into your site (Using another vulnerability in your site if there is one) and to pull off a Cross Site Scripting (XSS) attack. Using CSP 1.0 meant loading styles and scripts from separate CSS and JavaScript files. CSP 2.0 introduces two new ways to use in-line styles and scripts.

## Nonces

Nonces work a little like the [Anti-Forgery Token](http://www.asp.net/web-api/overview/security/preventing-cross-site-request-forgery-%28csrf%29-attacks) in ASP.NET MVC. A cryptographically random string is generated and sent to the client in the CSP HTTP header, as well as in the HTML with the style or script tag like so:

```http
Content-Security-Policy: default-src 'self'; 
                         script-src 'self' https://example.com 'nonce-Nc3n83cnSAd3wc3Sasdfn939hc3'
```

```xml
<script>
alert("Blocked because the policy doesn't have 'unsafe-inline'.")
</script>
<script nonce="EDNnf03nceIOfn39fn3e9h3sdfa">
alert("Still blocked because nonce is wrong.")
</script>
<script nonce="Nc3n83cnSAd3wc3Sasdfn939hc3">
alert("Allowed because nonce is valid.")
</script>
```

There is a problem however, web browsers that only support CSP 1.0, will not understand the nonce directive and will block the in-line script above. To resolve this issue, we combine the nonce with the `unsafe-inline` directive. CSP 1.0 web browsers will execute the in-line script as before (insecure but backwards compatible), but CSP 2.0 browsers will disregard 'unsafe-inline' when they see the nonce and only execute in-line scripts with the nonce set. This gives an upgrade path for existing sites and they can benefit from CSP 2.0 without requiring a massive rewrite to get rid of in-line styles and scripts.

Nonces can be easily implemented by using the HTML helper provided by [NWebSec](https://github.com/NWebsec/NWebsec). You can find out more about how this feature is implemented in NWebSec [here](https://github.com/NWebsec/NWebsec/wiki/Configuring-Content-Security-Policy#script-and-style-nonces-through-htmlhelpers).

```xml
<script @Html.CspScriptNonce()>document.write("Hello world")</script>
<style @Html.CspStyleNonce()>
   h1 {
          font-size: 10em;
        }
</style>
```

The big disadvantage with this approach is that the nonce is different for each response sent to the client. This means that you cannot cache any page using nonces. If your page is specific to a user, then you probably don't want to cache that page anyway and it doesn't matter but otherwise using nonces is not possible.

## Hashes

Using hashes solves the caching problem we have with nonces. The server computes the hash of a particular style or script tags contents, and includes the base64 encoding of that value in the Content-Security-Policy header like so:

```http
Content-Security-Policy: script-src 'sha512-YWIzOWNiNzJjNDRlYzc4MTgwMDhmZDlkOWI0NTAyMjgyY2MyMWJlMWUyNjc1ODJlYWJhNjU5MGU4NmZmNGU3OAo='
```

```xml
<script>
"alert('Hello, world.');"
</script>
```

As you can see, the script itself remains unchanged and only the HTTP header changes. We can now, happily cache the page with the in-line script in it. Unfortunately, at the time of writing [NWebSec](https://github.com/NWebsec/NWebsec) does not support hashes at all. If you feel this feature is worthwhile as I do, then you can raise an issue on NWebSec's [issue list](https://github.com/NWebsec/NWebsec/issues).

# Other CSP Support

So for the reasons you've learned above, using in-line styles and scripts is not the way to go. Apart from the fact that CSP will block them, you also cannot minify and obfuscate in-line scripts very easily using ASP.NET MVC (There are ways I have looked into but they aren't very good). So moving scripts to external CSS and JavaScript files will mean you can use CSP and you might get a small performance boost. So what's the problem? Well, CSP is not currently supported in a few major libraries.

## Modernizr Support for CSP

As I've said above [Modernizr](http://modernizr.com) makes use of in-line styles to test for various web browser capabilities and so requires the insecure 'unsafe-inline' directive to function. There is a [fix](https://github.com/Modernizr/Modernizr/pull/1263) for the problem but its very old and can no longer be merged into the current branch of the Modernizr code. I would fix it myself but I'm not enough of a JavaScript guru to do so. What I have done is raise [this](http://stackoverflow.com/questions/26532234/modernizr-causes-content-security-policy-csp-violation-errors) StackOverflow question which seeks to ask for a workaround or fix and to generally raise awareness.

So far, I've received no responses from GitHub or StackOverflow but there is hope. [AngularJS](https://angularjs.org) (Another popular JavaScript library) has a [CSP compatible mode](https://docs.angularjs.org/api/ng/directive/ngCsp) which makes use of an external CSS file but is very easy to set up. There is no reason why Modernizr could not have something similar. Another alternative is if NWebSec supports hashes, we can add work out the hashes of any scripts that Modernizr is using and include these in our CSP HTTP header.

## Browser Link Support for CSP

[Browser Link](http://www.asp.net/visual-studio/overview/2013/using-browser-link) is a very cool Visual Studio feature that allows you to update an MVC view while debugging and hit a refresh button to refresh any browsers using that page. Unfortunately, this handy feature is not compatible with CSP because Visual Studio adds in-line scripts to the bottom of the page you are debugging. This of course, causes CSP violation errors. A simple workaround is to either introduce the `unsafe-inline` directive while debugging or turn off browser link altogether.

I have raised [this](https://visualstudio.uservoice.com/forums/121579-visual-studio/suggestions/7389853-browser-link-support-for-content-security-policy) suggestion on Visual Studio's User Voice page to get the problem fixed. I understand that this area has been changed significantly in ASP.NET Core, so it may not be needed by the time we all upgrade.

# Mainstream CSP Adoption

So far, not many websites in the wild have implemented CSP. I think there are a few reasons:

1. Lack of browser support (Until now).
2. Lack of awareness by developers (Until this blog post I hope).
3. Framework providers such as Microsoft and its ASP.NET MVC have not given developers a way to implement CSP (NWebSec has stepped in here to fill this gap).
4. Prevalence of the use of in-line styles and scripts and unwillingness to switch to separate files (This is up to you).
5. Lack of support for CSP from popular CSS/JavaScript libraries due to the reason above (This is the biggest problem).
6. CSP gives us an extra layer of protection using a <a href="http://en.wikipedia.org/wiki/Defense_in_depth_%28computing%29">Defence in Depth</a> strategy. Some developers don't take web security seriously enough until they get hacked.
7. The older CSP HTTP headers (`X-Content-Security-Policy` or `X-WebKit-CSP`) were buggy or had unexpected behaviour (The `Content-Security-Policy` HTTP header no longer has this problem).
8. Developers are not making good use of the ability to report violations to their CSP policy using the `report-uri` directive. If you find a violation, you can quickly discover if someone is attacking your site, your CSP policy is not valid or you have a bug in your site.
9. Developers are scared of breaking their site because their CSP policy is too strict (This is often because CSP is being retrofitted to an existing spiders web of a site. If you start with CSP from the ground up, you will not have this problem).

# CSP in the Real World

There is a really interesting white paper written in 2014 and titled '[Why is CSP Failing? Trends and Challenges in CSP Adoption](http://mweissbacher.com/publications/csp_raid.pdf)' which goes over these issues I listed above in a lot more depth.

## Who is using CSP

According to the white paper, CSP is deployed in enforcement mode on only 1% of the Alexa Top 100 sites. I believe things are about to change. All major browsers now support the CSP HTTP header, [NWebSec](https://github.com/NWebsec/NWebsec) makes it easy to add to an MVC project, this blog post tells you exactly how it works and the [ASP.NET Core Boilerplate](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) project template gives you a project template that enables CSP by default, right out of the box.

There are big names using CSP right now. Go ahead and check the HTTP response headers from sites like Facebook, CNN, BBC, Google, Huffington Post, YouTube, Twitter and GitHub. Things have moved on from when the white-paper was written and CSP adoption is starting to gain traction. Read [Twitter](https://blog.twitter.com/2011/improving-browser-security-csp)'s case study, on adopting CSP.

## Browser Extensions and ISP's

Another interesting finding from the white-paper was that browser extensions and even ISP's were injecting scripts into pages, that caused CSP violation reports. CSP may break some browser extensions that inject code into the page. You may consider this a good or bad thing. From a security point of view, what you need to ask is, do you really trust any browser extension to modify your code? I don't know about you but I don't want any extensions and especially any ISP's dirty fingers in my source code.

You can use SSL/TLS which will stop most ISP's from fiddling with your code but some governments get around even this! So CSP gives us some extra protection from man in the middle attacks from browser extensions and ISP's.

## CSP and Advertising

Advertising can be a problem for CSP. Some ad providers are better than others. Some providers use resources whose locations are constantly changing which can cause CSP violation errors if your policy is too strict. CNN has adopted a novel workaround for this problem. It embeds all of its adverts into frames which show pages with no CSP restrictions or at least very liberal ones.

## CSP Policy Generation

There are special web crawlers that have been created to crawl all of the links on your domain, in an attempt to generate a valid CSP policy automatically. [CSP Tools](https://github.com/Kennysan/CSPTools) is one such project on GitHub, which given a list of URL's can crawl the web pages and generate a CSP policy. Another approach the tool uses is to look at your CSP violation error reports and come up with rules based on these.

Be careful using this approach however, it may not catch everything. The best approach is to build up your CSP policy as you build your site from the ground up and then carry out some testing to make sure you have got it right. You can set the CSP policy to report only mode, so that browsers don't actually block anything but do report CSP violation errors, once you are happy that no violations are being reported, you can apply your policy. Finally, you need to keep an eye out for CSP violation errors if they do occur and get them fixed as soon as you see them.

## Testing CSP Policies

The [CSP Tester](https://chrome.google.com/webstore/detail/csp-tester/ehmipebdmhlmikaopdfoinmcjhhfadlf) Chrome extension is an example of a tool you can use to apply CSP policies to your site and view the effects in the browser console window.

As I've mentioned before, the best way is to build CSP into your site as you build your site. You can use the `report-uri` directive to log any violations and get them fixed. You can also use the `Content-Security-Policy-Report-Only` HTTP header instead of `Content-Security-Policy`, to stop the browser from actually blocking anything if you are not confident in the level of testing you have done.

# Conclusions

Wow, that was a long blog post. I wanted it to be as comprehensive as possible. I hope I've shown that now is the time to invest in implementing CSP and if you are developing a new site, then integrating CSP into it at an early stage will mean that you reap the benefits of a much greater level of security. The [ASP.NET Core Boilerplate](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) project template is a great place to start and will give you a working code example which tells a thousand words on its own.
