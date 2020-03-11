---
title: "Minifying HTML for ASP.NET MVC"
description: "How much bandwidth does minifying HTML save. Minifying HTML in ASP.NET MVC 5 is hard work. Minifying HTML should be a built in feature of ASP.NET Core."
author: "Muhammad Rehan Saeed"
permalink: "/minifying-html-for-asp-net-mvc/"
cover_image: "./images/The-internet-is-a-series-of-tubes.jpg"
date: "2015-08-06"
published: true
categories:
  - "ASP.NET"
tags:
  - "ASP.NET MVC"
  - "HTML"
  - "Minification"
  - "Razor"
---

Using Razor comments or blocks of code can cause extra carriage returns to appear in the generated HTML. This has been a problem in all versions if ASP.NET MVC for a while now.

```html
<p>Paragraph 1</p>
@* Razor Comment *@
<p>Paragraph 2</p>
```

The above code generates the following HTML. You can imagine that with a lot of comments or code blocks you get a lot of ugly blank lines appearing in your mark-up.

```html
<p>Paragraph 1</p>

<p>Paragraph 2</p>
```

Ideally it should generate the HTML below without any blank lines. If you really wanted a blank line to appear, you could add one yourself before the comment.

```html
<p>Paragraph 1</p>
<p>Paragraph 2</p>
```

The main problem with the above is that it makes your HTML look ugly and hard to follow. You often end up with several blank lines, which breaks up the flow of the mark-up.

Also, given that every ASP.NET MVC site on the internet has this problem and probably contains at least two Razor comments and maybe a for-loop in the code somewhere, that is a lot of wasted extra bandwidth.

So I made [this](https://github.com/aspnet/Razor/issues/428) suggestion for the next version of ASP.NET Core, to change the behaviour to the expected one above and it got accepted!

# How Much Bandwidth Was Saved

So how much bandwidth has this single change saved the internet? That's the question I asked myself. According to the [httparchive.org](http://httparchive.org/trends.php), the average request is made up of around 57KB of HTML. If we assume that each page contains two comments and maybe a for-loop, that's six carriage returns (Two sets of), twelve characters or twelve bytes of wasted bandwidth. If we assume that all sites are using GZip compression, then we can make a conservative estimate of around six bytes of wasted bandwidth per request.

![Average HTML Transfer Size Over a Request Chart](./images/Average-HTML-Transfer-Size-Over-a-Request-Chart.png)

[Cisco](http://www.cisco.com/c/en/us/solutions/collateral/service-provider/visual-networking-index-vni/VNI_Hyperconnectivity_WP.html) forecasts that global IP traffic will pass the Zettabyte (1000 Exabytes) threshold by the end of 2016. If the the average transfer size per request is [2162 KB](http://httparchive.org/trends.php#numurls); and only 57 KB is HTML, we can work out that 257465 Terabytes of of the worlds internet traffic per year is HTML.

![Average Total Transfer Size Over a Request Chart](./images/Average-Total-Transfer-Size-Over-a-Request-Chart.png)

According to [w3techs.com](http://w3techs.com/technologies/history_overview/programming_language), 16.7% of all sites on the internet use ASP.NET as of 1st August 2015, lets assume half of those (8.35%) will use ASP.NET Core in a few years time. So, we can say that very roughly 21498 Terabytes of the worlds bandwidth is consumed on ASP.NET HTML requests per year.

If the average wasted bandwidth is six bytes out of a total of 57 KB per HTML request, then we come to a grand total of around 2.3 Terabytes of bandwidth saved per year. I must admit, that's a lot of bandwidth but I still thought it would be a lot more than that.

# HTML Minification

An even better solution would be to minify the HTML. There are solutions like [Web Markup Min](http://webmarkupmin.codeplex.com/) for ASP.NET Core but it works at runtime and is a little involved to set up, so all but the most determined developers use this feature.

Then there is [Dean Hume's](http://www.deanhume.com/Home/BlogPost/a-simple-html-minifier-for-asp-net/2097) compile time minifier which sounded perfect. In Dean's post he gets savings of around 20-30% by minifying his HTML. If we applied a conservative 20% saving to all ASP.NET Core HTML requests, that would work out to be a 4300 Terabyte saving in global bandwidth per year!

So far, I've only mentioned the bandwidth saving but downloading smaller HTML files will also mean quicker page load times. HTML is the first thing a browser downloads before it can go off and download all the other CSS, JavaScript, fonts and images a site needs to display a page. Making this download smaller, is a small but effective way to get pages up quicker.

These days, MVC has things like CSS and JavaScript minification built in as standard. To squeeze out even more performance, HTML minification is the next logical step.

So I made [this](https://github.com/aspnet/Razor/issues/423) suggestion for ASP.NET Core to implement Dean's compile time minification of Razor views by default. So far, it's not been taken up but I live in hope and write this blog post to show how cool a feature it is.

Please do go and post your support for this feature. We don't necessarily need to use Dean's technique, minifying HTML could just as easily be a Grunt or Gulp task.

# Conclusions

This post contains huge leaps of guess work and estimation. I hope my maths is up to scratch but I would not be surprised if I was off by a decimal point or two. Still, we are talking huge numbers here and I hope I've convinced you that minifying HTML is worth the effort.
