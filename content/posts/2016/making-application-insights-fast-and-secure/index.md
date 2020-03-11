---
title: "Making Application Insights Fast & Secure"
description: "Implementing Application Insights into your ASP.NET Core application with performance and security as a top priority in this advanced scenario."
author: "Muhammad Rehan Saeed"
permalink: "/making-application-insights-fast-and-secure/"
cover_image: "./images/Application-Insights.png"
date: "2016-12-11"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET"
  - "Application Insights"
  - "ASP.NET Core"
  - "ASP.NET MVC"
  - "ASP.NET Core Boilerplate"
  - "C#"
  - "Content Security Policy"
---

# What is Application Insights?

It's an application monitoring tool available on Microsoft's Azure cloud that you can use to detect errors and usage in your application. For ASP.NET Core apps, it can do this for both your C# and JavaScript code. It's main competitors are [New Relic](https://newrelic.com/) and [RayGun](https://raygun.com/).

# Implementing Application Insights

Following the [Getting Started](https://github.com/Microsoft/ApplicationInsights-aspnetcore/wiki/Getting-Started) guide for ASP.NET Core applications requires you to add the following HTML helper to your `_Layout.cshtml` file:

```html
<head>
    @* ...Omitted *@

    @Html.ApplicationInsightsJavaScript(TelemetryConfiguration) 
</head>
```

This HTML helper adds an inline script containing the minified JavaScript in [snippet.js](https://github.com/Microsoft/ApplicationInsights-JS/blob/master/JavaScript/JavaScriptSDK/snippet.js).

```html
<script type="text/javascript">
    var appInsights=window.appInsights||function(config){{
        function i(config){{t[config]=function(){{var i=arguments;t.queue.push(function(){{t[config].apply(t,i)}})}}}}var t={{config:config}},u=document,e=window,o="script",s="AuthenticatedUserContext",h="start",c="stop",l="Track",a=l+"Event",v=l+"Page",y=u.createElement(o),r,f;y.src=config.url||"https://az416426.vo.msecnd.net/scripts/a/ai.0.js";u.getElementsByTagName(o)[0].parentNode.appendChild(y);try{{t.cookie=u.cookie}}catch(p){{}}for(t.queue=[],t.version="1.0",r=["Event","Exception","Metric","PageView","Trace","Dependency"];r.length;)i("track"+r.pop());return i("set"+s),i("clear"+s),i(h+a),i(c+a),i(h+v),i(c+v),i("flush"),config.disableExceptionTracking||(r="onerror",i("_"+r),f=e[r],e[r]=function(config,i,u,e,o){{var s=f&amp;&amp;f(config,i,u,e,o);return s!==!0&amp;&amp;t["_"+r](config,i,u,e,o),s}}),t
    }}({{
        instrumentationKey: '{0}'
    }});

    window.appInsights=appInsights;
    appInsights.trackPageView();
</script>
```

This script is responsible for:

1. Containing the users instrumentation key (The HTML helper adds this for you).
2. Downloading the full application insights script asynchronously which actually does all the work.
3. Recording any logs that occur while the full script is downloaded

# The Problem

For most websites, this is fine and you can stop here. Here is what can be improved for the rest:

1. The above adds 1KB to every HTML page. Moving this script into a separate file would mean that this script could be cached in the browser the first time it was downloaded. A separate file could also be distributed to a CDN and globally distributed very quickly.
2. If you are using a [Content Security Policy (CSP)](http://rehansaeed.com/content-security-policy-for-asp-net-mvc/) to secure your site using inline scripts in your site is a big no no. You could use a nonce (A nonce means you can't cache the page as each page becomes unique) or even better a hash of the script contents but browser support for CSP 2.0 is not great. Using an external script would be the simplest option.

# Making It Slightly Faster and More Secure

So what does it take to move the above `snippet.js` file into a separate file? Well, it turns out that you can get `snippet.js` from the [applicationinsights-js](https://www.npmjs.com/package/applicationinsights-js) NPM package which you can add to your `package.json` like so:

```json
{
  "dependencies": {
    "applicationinsights-js": "1.0.5"
    // ...
  }
  // ...
}
```

The next step is to inject your instrumentation key into `snippet.js` and also the URL to the full application insights script which is missing from the `snippet.js` file in the NPM package. I do this using a gulp task like so:

```js
var gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),    // Creates source map files (https://www.npmjs.com/package/gulp-sourcemaps/)
    replace = require('gulp-replace-task'),     // String replace (https://www.npmjs.com/package/gulp-replace-task/)
    uglify = require('gulp-uglify');            // Minifies JavaScript (https://www.npmjs.com/package/gulp-uglify/)

gulp.task('build-app-insights-js',
    function() {
        return gulp
            .src('./node_modules/ApplicationInsights-JS/JavaScript/JavaScriptSDK/snippet.js')
            .pipe(sourcemaps.init())               // Set up the generation of .map source files for the JavaScript.
            .pipe(
                replace({                          // Carry out the specified find and replace.
                    patterns: [
                        {
                            // match - The string or regular expression to find.
                            match: 'CDN_PATH',
                            // replacement - The string or function used to make the replacement.
                            replacement: 'https://az416426.vo.msecnd.net/scripts/a/ai.0.js'
                        },
                        {
                           match: 'INSTRUMENTATION_KEY',
                           replacement: '11111111-2222-3333-4444-555555555555'
                        }
                    ],
                    usePrefix: false
                }))
            .pipe(uglify())                        // Minifies the JavaScript.
            .pipe(sourcemaps.write('.'))           // Generates source .map files for the JavaScript.
            .pipe(gulp.dest('./wwwroot/js/'));     // Saves the JavaScript file to the specified destination path.
});
```

Finally we can include the script in our HTML. Don't forget to include the `crossorigin` attribute on all your script tags, which allows full stack traces to be reported. You can read more about the `crossorigin` attribute [here](https://raygun.com/blog/2015/05/fixing-script-errors/).

```html
<script asp-append-version="true"
        crossorigin="anonymous"
        src="~/js/application-insights.js"></script>
```

# Conclusion

As usual, all of the above is built in to the [ASP.NET Core Boilerplate](https://github.com/ASP-NET-MVC-Boilerplate/Templates) project template, available as a [Visual Studio extension](https://visualstudiogallery.msdn.microsoft.com/6cf50a48-fc1e-4eaf-9e82-0b2a6705ca7d) if you select the optional Application Insights feature.
