---
title: "Make Certificate"
description: "Make certificate files by answering a few simple questions instead of using makecert.exe and pvk2pfx.exe, passing in some pretty cryptic arguments."
author: "Muhammad Rehan Saeed"
permalink: "/make-certificate/"
cover_image: "/images/hero/Make-Certificate-1366x768.png"
date: "2016-02-07"
dateModified: null
published: true
categories:
  - "Security"
tags:
  - "Certificates"
  - "MakeCertificate"
  - "PowerShell"
  - "Private Key"
  - "Public Key"
  - "SSL"
  - "TLS"
---

Making your own certificate files is quite hard work. You have to use `makecert.exe` and `pvk2pfx.exe`, passing in some pretty cryptic arguments which you always have to go back and research.

Learning how to make a certificate and the different types of certificate is pretty important. I highly recommend reading [this](http://www.jayway.com/2014/09/03/creating-self-signed-certificates-with-makecert-exe-for-development/) blog post from Jayway.com which has some very detailed instructions and is the basis of MakeCertificate.

To make things easier I made a PowerShell script called `MakeCertificate.ps1` which you can get on the [MakeCertificate](https://github.com/RehanSaeed/MakeCertificate) GitHub page. It asks you to pick the type of certificate you want to create, there are a few different types of certificates that MakeCertificate helps to make: Certificate Authority (CA) Certificates, SSL/TLS Server Certificates and Client Certificates. You are then asked a series of questions which when answered outputs three files

- .cer - A public key file that can be shared.
- .pvk - A private key file that should be kept secret.
- .pfx - A combined public and private key file that should be kept secret.

It also outputs the command you need to execute using `makecert.exe` and `pvk2pfx.exe` to recreate the certificate.
