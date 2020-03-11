---
title: "Is ASP.NET Core now a Mature Platform?"
description: "ASP.NET Core a large developer base, a large number of GitHub projects, StackOverflow questions, bloggers and companies who use it. It's a mature platform."
author: "Muhammad Rehan Saeed"
permalink: "/is-asp-net-core-now-a-mature-platform/"
cover_image: "./images/Rocket.jpg"
date: "2018-12-18"
published: true
categories:
  - "ASP.NET"
tags:
  - ".NET Core"
  - "ASP.NET Core"
  - "HTTP/2"
  - "HTTP/3"
  - "Lets Encrypt"
---

# Update (12/01/2019)

It seems that Damian Edwards (The ASP.NET Core Project Manager) likes this post and agrees with the points I've made! It's great to hear that he's is in alignment with my thoughts and that's a great indication that the pain points of the platform will get solved in the future. Take a look at what he says in the ASP.NET Community Stand-up below:

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/ho-VF2dAszI?start=1299" frameborder="0" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

# The Upgrade Train

I started using ASP.NET Core back when it was still called ASP.NET 5 and it was still in beta. In those early days every release introduced a sea change. The beta's were not beta's at all but more like alpha quality bits. I spent more time than I'd like just updating things to the latest version with each release.

Compared to the past, updates are moving at a glacial pace. Compared to the full fat .NET Framework though, it's been like moving from a camel to an electric car. When releases do come there is still a lot in each release. If you have a number of micro services using ASP.NET Core, it's not quick to get them all updated. Also, it's not just ASP.NET Core but all of the satellite assemblies built on top of .NET Core that keep changing too, things like Serilog and Swashbuckle.

What about other platforms? Well, I'm familiar with Node.js and the situation there is bordering on silly. Packages are very unstable and constantly being rev'ed. Keeping up and staying on latest is a constant battle almost every day. Each time you upgrade a package, there is also a danger that you will break something. With .NET Core, there are fewer packages and they are much more stable.

Overall, things move fast in software development in general and for me that's what keeps it interesting. ASP.NET Core is no exception.

# Show me the API's!

.NET Core and ASP.NET Core started out very lightweight. There were few API's available. You often had to roll your own code, even for basic features that should exist.

In today's world, a lot of API's have been added and where there are gaps, the community has filled them in many places. The .NET Framework still has a lot of API's that have not been ported across yet. A lot of these gaps are Windows specific and I'm sure a lot will be filled in the .NET Core 3.0 time frame.

When I make a comparison with Node.js and take wider community packages into consideration, I'd say that .NET Core has fewer API's. Image compression API's don't even exist on .NET for example. We were late to the party with Brotli compression which was recently added to .NET Core and is soon going to be added to the ASP.NET Core compression middleware, so we'll get there eventually. We have [GraphQL.NET](https://github.com/graphql-dotnet/graphql-dotnet) which is very feature rich but it still lags behind the JavaScript Apollo implementation slightly where it has first party support (Perhaps that comparison is a little unfair as GraphQL is native to Node.js). When I wanted to add Figlet font support to [Colorful.Console](http://colorfulconsole.com/) (Figlet fonts let you draw characters using ASCII art), I had to base my implementation off of a JavaScript one. I'm not the only one who translates JavaScript code to C# either.

With all this said, Node.js and JavaScript in general has it's own unique problems, otherwise I'd be using it instead of being a mainly .NET Core developer.

# It's Open Sauce

Making .NET Core and ASP.NET Core open source has made a huge difference. We'd all occasionally visit the .NET Framework docs to understand how an API worked but today the place to go is GitHub where you can not only see the code but read other peoples issues and even raise issues of your own. There is often someone who has been there and done it all before you.

Not only that but a huge community has grown up with bloggers and new projects being more commonplace. It cannot be underestimated how much this change has improved a developers standard of living. Just take a look at the brilliant [discoverdot.net](https://discoverdot.net/) site where you can see 634 GitHub .NET projects for all the evidence you need.

# Feel the Powa!

ASP.NET Core's emphasis on performance is refreshing. It's doing well in the [TechEmpower benchmarks](https://www.techempower.com/benchmarks/) with more improvements in sight. It's nice to get performance boosts from your applications every time you upgrade your application without having to do any work at all yourself.

While the platform is miles ahead of Node.js there are newer languages like Go that are also quite nice to write code for but blazing fast too. However, I'm not sure you can be as productive writing Go as with .NET Core. Also, you've got to use the write tool for the job. There are definitely cases where Go does a better job.

One interesting effort that I've been keeping an eye on for some time now is .NET Native where C# code is compiled down to native code instead of an intermediate language. This means that the intermediate language does not need to be JIT'ed and turned into machine code at runtime which speeds up execution the first time the application is run. A nice side effect of doing this is that you also end up with a single executable file. You get all the benefits of a low level language like Go or Rust with none of the major drawbacks! I've been expecting this to hit for some time now but it's still not quite ready.

# Security is Boring but Important

This is a subject that most people have never thought about much. It's trivial for an evil doer to insert some rogue code into an update to a package and have that code running in applications soon after. In fact that's what happened with the [event-stream NPM package](https://github.com/dominictarr/event-stream/issues/116) recently. I highly recommend reading Jake Archibald's post ["What happens when packages go bad"](https://jakearchibald.com/2018/when-packages-go-bad/).

What about .NET Core? Well, .NET is in fairly rare position of having a large number of official packages written by and maintained by Microsoft. This means that you need less third party packages and in fact you can sometimes get away with using no third party dependencies what so ever. What this also means, is that your third party dependencies that you do end up using also have fewer other dependencies in turn.

NuGet also recently added support for [signed packages](https://blog.nuget.org/20150203/package-signing.html), which stops packages from being tampered with between NuGet's server and your build machine.

Overall this is all about reducing risk. There will always be a chance that somebody will do something bad. I'd argue that there is less of a risk of that happening on the .NET platform.

# Who is using it?

Bing.com is [running on ASP.NET Core](https://blogs.msdn.microsoft.com/dotnet/2018/08/20/bing-com-runs-on-net-core-2-1/) and a site doesn't get much bigger than that. StackOverflow is [working on their transition](https://nickcraver.com/blog/2018/11/29/stack-overflow-how-we-do-monitoring/) to .NET Core. The [Orchard CMS](https://github.com/OrchardCMS/OrchardCore) uses .NET Core. Even WordPress and various PHP applications can be run on .NET Core these days using [peachpie](https://www.peachpie.io/).

# What's Still Missing?

First of all, let me say that every platform has gaps that are sometimes filled by the community. There are several missing API's that seem obvious to me but have yet to be built or improved enough. Here are a few basic examples of things that could be improved and where maybe the small team of 20 ASP.NET Core developers (Yes, their team is that small and they've done a tremendous job of building so much with so few resources, so they definitely deserve a pat on the back) could perhaps better direct their efforts.

## Caching Could be Better

The response caching still only supports in-memory caching. If you want to cache to Redis using the IDistributedCache, [bad luck](https://github.com/aspnet/AspNetCore/issues/2603). Even if you go with it and use the in-memory cache, if you're using cookies or the Authorization HTTP header, you've only got more [bad luck](https://github.com/aspnet/AspNetCore/issues/2606) as response caching turns itself off in those cases. Caching is an intrinsic part of the web, we need to do a better job of making it easier to work with.

## Everyone is Partying with Lets Encrypt

Security is hard! HTTPS is hard! Dealing with certificates is hard! What if you could use some middleware and supply it with a couple of lines of configuration and never have to think about any of it ever again? Isn't that something you'd want? Well, it turns out that Nate McMaster has built a [LetsEncrypt middleware](https://github.com/natemcmaster/LetsEncrypt) that does just that but he needs some help to [persuade his boss](https://github.com/natemcmaster/LetsEncrypt/issues/2#issuecomment-426501116) to build the feature, so up-vote this [issue](https://github.com/aspnet/KestrelHttpServer/issues/2971).

Microsoft seems a bit late to the part, it's also one of the top voted feature requests on [Azure's User Voice](https://feedback.azure.com/forums/169385-web-apps/suggestions/15099342-add-support-for-let-s-encrypt-in-the-azure-portal) too.

## HTTP/2 and HTTP/3

HTTP/2 support in ASP.NET Core is available in 2.2 but it's not battle tested so you can't run it at the edge, wide open to the internet for fear of getting hacked.

HTTP/3 ([formerly named QUIC](https://www.zdnet.com/article/http-over-quic-to-be-renamed-http3/)) support has been talked about and the ground work for it has already been done so that the Kestrel web server can support multiple protocols easily. Lets see hoq quickly we can get support.

One interesting thing about adding support for more protocols to ASP.NET Core is that most people can't make use of them or don't need to. ASP.NET Core applications are often hidden away behind a reverse proxy web server like IIS or NGINX who implement these protocols themselves. Even using something like Azure App Service means that you run behind a special fork of IIS. So I've been thinking, what is the point? Well, you've could use Kubernetes to expose your ASP.NET Core app over port 80 and get the performance boost of not having to use a reverse proxy web server as a man in the middle. Also, contrary to popular belief, Kubernetes can expose multiple ASP.NET Core applications over port 80 (at least [Azure AKS can](https://stackoverflow.com/questions/53415487/what-are-the-advantages-of-using-kubernetes-ingress-in-azure-aks)).

## Serving Static Files

Serving static files is one of the most basic features. There are a few things that could make this a lot better. You [can't use](https://github.com/aspnet/AspNetCore/issues/2457) the authorization middleware to limit access to static files but I believe that's changing in ASP.NET Core 3.0. Serving GZIP'ed or Brotli'ed content is a must today. Luckily dynamic Brotli compression will soon be available. What's [not available](https://github.com/aspnet/AspNetCore/issues/2458) is serving pre-compressed static files.

# Is It A Mature Platform?

There is a lot less churn. There are a lot of open source projects you can leverage. A large enough developer base has now grown up, so you see a lot more GitHub projects, StackOverflow questions, bloggers like myself and companies who make their living from the platform.

There seems to be a trend at the moment where people are jumping ship from long standing platforms and languages to brand new ones. Android developers have jumped from Java to Kotlin (and have managed to delete half their code in the process, Java is so verbose!). The poor souls who wrote Objective C, have jumped to Swift. Where once applications would be written in C++, they are now written in Go or Rust. Where once people wrote JavaScript, they are still writing JavaScript (TypeScript has taken off but not completely)...ok that has not changed. .NET Core seems to be the only one that seems to have bucked the trend and tried to reinvent itself completely while not changing things too much and still succeeding in the process.

So yes, yes it is, is my answer.
