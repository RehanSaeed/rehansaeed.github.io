---
title: "Azure Active Directory Versus Identity Server"
description: "A comparison between Azure Active Directory and Identity Server covering the advantages and disadvantages of both."
author: "Muhammad Rehan Saeed"
permalink: "/azure-active-directory-versus-identity-server/"
cover_image: "./images/Azure-Active-Directory-Versus-Identity-Server.png"
date: "2016-05-20"
published: true
categories:
  - "Security"
tags:
  - "Active Directory"
  - "Azure Active Directory"
  - "Cloudflare"
  - "Connect Health"
  - "IdentityServer"
  - "IdentityServer4"
  - "Two-Factor Authentication"
---

::: warning Disclaimer
I looked into this subject for use by the company I work for, who had existing infrastructure I had to cater to, so the solution I chose is skewed in that direction. Even so I've tried to give an impartial summary of my own thoughts during my research. I originally asked this question on an Identity Server GitHub [issue](https://github.com/IdentityServer/IdentityServer3/issues/2116).
:::

# Azure Active Directory

Azure Active Directory is a hosted identity solution, so there is far less setup (especially if like me, you discover that to your surprise, you are already using it for Office 365). Out of the box, it provides some very nice features that can get you started very quickly.

## On-Premises Active Directory

Azure Active Directory can connect to an on-premises Active Directory server very easily using something called [Azure AD Connect](https://azure.microsoft.com/en-gb/documentation/articles/active-directory-aadconnect/). Most companies are not running everything in the cloud and have an on-premises AD server, so this is a pretty big killer feature.

Syncing the two directories happens transparently but there are a bunch of things that can be configured like the way passwords are synced. I'm not a system administrator so I've not set this up personally but most IT admins can do this pretty painlessly.

## Connect Health

The premium edition of Azure Active Directory has a monitoring and reporting capability called [Connect Health](https://azure.microsoft.com/en-gb/documentation/articles/active-directory-aadconnect-health/) so you can see who is logging into your system and when. You can also get alerts for any seemingly nefarious activity, like a report on the top 50 users with failed username and password attempts, as well as a report on whether Azure AD is syncing correctly with any on-premises AD server you might have. It's a pretty nice feature for IT Admins, while others might not care too much about it.

![Azure Active Directory Connect Health](./images/Azure-Active-Directory-Connect-Health.png)

## Two-Factor Authentication

The premium edition has two factor authentication built in right out of the box, so no having to setup a text message provider, plus the costs of sending those messages are included out of the box.

## Cloudflare for Identity

Microsoft is monitoring all logins and actively blocks activity from known attackers (a bit like cloudflare for identity), so it should in theory provide some added security. There is not much detail about this though.

## Managing Users

You can manage users from the Azure portal but the UI is just about passable. If you are using Office 365, you're in a better position as it provides a better UI to manage users.

## UI Customization

Customization of the UI is very basic. You can provide a company logo and background image, which get displayed on the login screens but that's about it.

## Developer Experience

The overall developer experience is pretty slick. Creating a new project in Visual Studio lets you enable integration with Azure AD by just logging in using your Azure credentials and selecting your Azure AD account. It doesn't get any easier than that for simple scenarios.

For more complex scenarios, you will inevitably have to log into the Azure Portal and configure things a bit more. You often end up having to download and edit an XML configuration file from the Azure Portal. This is not the best experience in the world.

## Overall

You have to pay for the premium features and using the Azure Portal to do identity management is kind of a pain. Out of the box though this is ridiculously fast to setup and can get you up to speed very quickly, while giving you a secure platform.

The documentation is pretty good and there are samples on GitHub with Microsoft developers actively monitoring the issues which was helpful. Some links I found useful:

- [Documentation home page.](https://azure.microsoft.com/en-gb/documentation/articles/active-directory-whatis/)
- [Documentation for each type of authentication flow.](https://azure.microsoft.com/en-gb/documentation/articles/active-directory-authentication-scenarios/)
- [Samples covering every authentication flow.](https://azure.microsoft.com/en-gb/documentation/articles/active-directory-code-samples/#server-or-daemon-application-to-web-api)
- Introduction [video 1 (Channel 9)](https://channel9.msdn.com/Shows/Azure-Friday/Azure-Identity-101-Vittorio-explains-Federation-and-the-basics-of-Azure-Active-Directory) and [video 2 (Channel 9)](https://channel9.msdn.com/Shows/Azure-Friday/Azure-Identity-102-Vittorio-creates-a-Windows-Azure-Active-Directory-in-Azure).
- Build 2016 videos:
    - [Business-to-Consumer Identity Management with Azure Active Directory B2C](https://channel9.msdn.com/Events/Build/2016/P423)
- Build 2015 videos:
    - [Azure Active Directory Identity Management as a Service for Modern Applications](https://azure.microsoft.com/en-gb/documentation/videos/build-2015-azure-active-directory-identity-management-as-a-service-for-modern-applications/)
    - [Develop Modern Web Applications with Azure Active Directory](https://azure.microsoft.com/en-gb/documentation/videos/build-2015-develop-modern-web-applications-with-azure-active-directory/)
    - [Develop Modern Native Applications with Azure Active Directory](https://azure.microsoft.com/en-gb/documentation/videos/build-2015-develop-modern-native-applications-with-azure-active-directory/)

# IdentityServer

IdentityServer is the Swiss Army knife of Identity management. It can do everything but does require a small amount of setup and a little more knowledge of the identity space. It can do most things that I listed above and a lot more beyond.

## Multiple Identity Sources

IdentityServer can connect to one or more identity sources. It has to be noted that even if you are using Azure Active Directory, there may still be reasons for choosing IdentityServer which I had not initially considered. For example, if you have more than one source of user data e.g. You are using AD and also a SQL database of users, then IdentityServer can be used to point to both of these sources of user information. In theory it should also make it easier to switch from AD to something else entirely as it decouples things.

## Application Insights

It's possible to integrate Application Insights yourself and record things like logins and password resets. You could build a dashboard of graphs which looks like Connect Health. In fact, you can make it look exactly like Connect Health with very little effort.

## Two-Factor Authentication

Two-Factor Authentication requires a third party provider to send text messages and of course this means that there will be a monetary cost. In addition there is a small amount of code you have to write to get things connected.

## Use Cloudflare

Azure Active Directory provides some built in support for blocking malicious activity, a bit like Cloudflare but for identity. With IdentityServer, you could use the real Cloudflare and get some added protection for very little effort.

## UI Customization

UI customization is where IdentityServer shines. You have full access to the HTML and CSS and can fully customize the look and feel to your hearts content.

## Developer Experience

IdentityServer is built by [Dominick Baier](https://leastprivilege.com/), [Brock Allen](https://brockallen.com/) and the open source community. I actually did a WCF course under the instruction of Dominick many years ago and I can tell you that IdentityServer is in capable hands.

Any questions or issues you have would be posted on the relevant [IdentityServer GitHub](https://github.com/IdentityServer) project. Dominick, Brock and other community members often answer questions. Overall, it's run as a healthy open source project.

## Microsoft Backing

Microsoft has attempted to build their own identity provider in the past but the solution wasn't the best. Having embraced open source, they now recommend IdentityServer themselves.

## Overall

The project is actively developed on GitHub and it has well known developers at the helm. There are code samples for all the authentication flows and you can get answers from the community. Some links I found useful:

- [IdentityServer4 GitHub home page.](https://github.com/IdentityServer/IdentityServer4)
- [Samples covering every authentication flow.](https://github.com/IdentityServer/IdentityServer4.Samples)
- [IdentityManager GitHub home page](https://github.com/IdentityManager/IdentityManager) (A separate application for handling users, groups and roles).
- [IdentityServer Admin GitHub home page](https://github.com/IdentityServer/IdentityServer3.Admin) (A tool for managing clients and scopes).
- [Introduction video at NDC 2016 (Vimeo).](https://vimeo.com/154172925)

# Authentication Flows

**Fact**: Security is really really hard. There are lots of different ways of doing authentication called 'flows'. I put [this link](https://azure.microsoft.com/en-gb/documentation/articles/active-directory-authentication-scenarios/) here because I found it very useful for understanding them. Also, the following diagram is key to understanding this entire topic.

![Authentication Flows](./images/Authentication-Flows.png)

# Summary

What you decide to choose depends entirely on the problem you have. Which should you choose? Well, it depends on the number of developers, time, money and effort you can expend setting everything up. There is no one size fits all solution. Really, the differences in the two products above are the differences between a SaaS and PaaS solution.

Which did I choose? While I was doing this research, I discovered to my surprise that the company I work for already had an Azure Active Directory linked to an on-premises Active Directory server because we were using Office 365. That made the choice much easier for us.
