---
title: "NGINX for ASP.NET Core In-Depth"
description: "NGINX is a popular open source web server. It can act as a reverse proxy server for ASP.NET Core web apps. How to configure NGINX for ASP.NET Core."
author: "Muhammad Rehan Saeed"
permalink: "/nginx-asp-net-core-depth/"
heroImage: "/images/hero/NGINX-1366x768.png"
date: "2016-08-21"
dateModified: null
published: true
categories:
  - "ASP.NET"
tags:
  - "ASP.NET Core"
  - ".NET Boxed"
  - "Brotli"
  - "HTTP 2.0"
  - "IIS"
  - "Internet Information Services (IIS)"
  - "Kestrel"
  - "NGINX"
  - "Web Server"
---

> There are only two things a web server needs to be.....fast.....really fast.....and secure.
> <footer><cite>Muhammad Rehan Saeed</cite></footer>

# About NGINX

[NGINX](http://nginx.org/) (Pronounced engine-x) is a popular open source web server. It can act as a reverse proxy server for TCP, UDP, HTTP, HTTPS, SMTP, POP3, and IMAP protocols, as well as a load balancer and a HTTP cache.

NGINX in fact [overtook Apache](https://w3techs.com/blog/entry/nginx_just_became_the_most_used_web_server_among_the_top_1000_websites) as the most popular web server among the top 1000 websites. After playing with it for a while now, I have to say that I can see why.

There are two flavours of NGINX. The first is the open source version which is free, the other is called [NGINX Plus](https://www.nginx.com/products/) and provides some more advanced features (all of which can be replicated with open source plugins but with a lot effort) and proper support but at the cost of a few thousand dollars.

There is a Windows version of NGINX but I wouldn't recommend using it for real as it doesn't perform as well as the Linux version and it's not as well tested. You can however use it to try out NGINX.

Alternatively, if you are running on Windows 10 Anniversary Update, you can install Bash for Windows and install the linux version. However the process is [not that straightforward](https://www.svennd.be/running-nginx-on-bash-for-windows-10/). Again, the caveat is that it can only be used for testing and not in production.

# IIS vs NGINX

NGINX has no UI, it's all command line driven but don't let that put you off, the [CLI interface](https://www.nginx.com/resources/wiki/start/topics/tutorials/commandline/) only has three commands you actually need:

1. Check my NGINX config (`nginx -t`).
2. Load my NGINX config (`nginx -s reload`).
3. By default the `nginx.conf` file is located in the NGINX installation folder. You can use that file or your own using (`nginx -c [nginx.conf File Path]`).

IIS on the other hand does have a UI and what a travesty it is. It hasn't really changed for several years and really needs a usability study to hack it to pieces and start again.

The command line experience for IIS is another matter. It has very powerful IIS extensions you can install and the latest version of IIS even has an API that you can use to make simple HTTP calls to to update it.

Configuration is where NGINX shines. It has a single super simple `nginx.conf` file which is pretty well documented. IIS is also actually pretty simple to configure if you only rely on the `web.config` file.

# Setting up NGINX

The [ASP.NET Core Documentation](https://docs.asp.net/en/latest/publishing/linuxproduction.html) site has some very good documentation on how to get started on Ubuntu. Unfortunately, it's not as simple as just installing NGINX using `apt-get install nginx`, there are a few moving parts to the process and a lot more moving parts if you want to install any additional modules.

If you're on Windows, as I mentioned earlier you have the options of installing NGINX using Bash for Windows 10 Anniversary Update but I couldn't get this working. Alternatively you can download the NGINX executable for Windows. If you do this, beware that NGINX tries to start on port 80 and there are a number of things that use that port already on Windows:

1. Skype uses port 80 (Why?), turn it off in the advanced settings.
2. Turn off IIS.
3. Stop the SQL Server Reporting Services service.

Once you have NGINX setup, you need to run your ASP.NET Core app using the Kestrel web server. Why does ASP.NET Core use two web servers? Well Kestrel is not security hardened enough to be exposed on the internet and it does not have all of the features that a full blown web server like IIS or NGINX has. NGINX takes the role of a [reverse proxy](https://en.wikipedia.org/wiki/Reverse_proxy) and simply forwards requests to the Kestrel web server. One day this may change. Reliably keeping your ASP.NET Core app running in Linux is also described in the [ASP.NET Core Documentation](https://docs.asp.net/en/latest/publishing/linuxproduction.html).

# Aiming For The Perfect Config File

You've got NGINX running, all you need now is a `nginx.conf` file to forward requests from the internet to your ASP.NET Core app running using the Kestrel web server.

I've taken the time to combine the recommendations from the [HTML5 Boilerplate](https://github.com/h5bp/server-configs-nginx/blob/master/nginx.conf) project, the [ASP.NET Core NGINX Documentation](https://docs.asp.net/en/latest/publishing/linuxproduction.html), the [NGINX Docs](http://nginx.org/en/docs/) and my own experience to build the `nginx.config` (and `mime.types` file) file below specifically for the best performance and security and to target .NET Core apps.

Not only that but I've gone to extreme lengths to find out what every setting actually does and have written short comments describing each and every setting. The config file is self describing, from this point forward it needs no explanation.

```
# Configure the Nginx web server to run your ASP.NET Core site efficiently.
# See https://docs.asp.net/en/latest/publishing/linuxproduction.html
# See http://nginx.org/en/docs/ and https://www.nginx.com/resources/wiki/

# Set another default user than root for security reasons.
# user						xxx;

# The maximum number of connections for Nginx is calculated by:
# max_clients = worker_processes * worker_c
worker_processes			1;

# Maximum file descriptors that can be opened per process
# This should be > worker_connections
worker_rlimit_nofile		8192;

# Log errors to the following location. Feel free to change these.
error_log					logs/error.log;
# Log NXingx process errors to the following location. Feel free to change these.
pid							logs/nginx.pid;

events {

    # When you need > 8000 * cpu_cores connections, you start optimizing
    # your OS, and this is probably the point at where you hire people
    # who are smarter than you, this is *a lot* of requests.
    worker_connections		8000;

    # This sets up some smart queueing for accept(2)'ing requests
    # Set it to "on" if you have > worker_processes
    accept_mutex			off;

    # These settings are OS specific, by defualt Nginx uses select(2),
    # however, for a large number of requests epoll(2) and kqueue(2)
    # are generally faster than the default (select(2))
    # use epoll; # enable for Linux 2.6+
    # use kqueue; # enable for *BSD (FreeBSD, OS X, ..)

}

http {

    # Include MIME type to file extension mappings list.
    include                 mime.types;
    # The default fallback MIME type.
    default_type            application/octet-stream;

    # Format for our log files.
    log_format              main '$remote_addr - $remote_user [$time_local]  $status '
                                 '"$request" $body_bytes_sent "$http_referer" '
                                 '"$http_user_agent" "$http_x_forwarded_for"';

    # Log requests to the following location. Feel free to change this.
    access_log              logs/access.log  main;

    # The number of seconds to keep a connection open.
    keepalive_timeout       29;
    # Defines a timeout for reading client request body.
    client_body_timeout     10;
    # Defines a timeout for reading client request header.
    client_header_timeout   10;
    # Sets a timeout for transmitting a response to the client.
    send_timeout            10;
    # Limit requests from an IP address to five requests per second.
    # See http://nginx.org/en/docs/http/ngx_http_limit_req_module.html#limit_req_zone
    limit_req_zone          $binary_remote_addr zone=one:10m rate=5r/s;

    # Disables emitting Nginx version in error messages and in the 'Server' HTTP response header.
    server_tokens           off;

    # To serve static files using Nginx efficiently.
    sendfile                on;
    tcp_nopush              on;
    tcp_nodelay             off;

    # Enable GZIP compression.
    gzip                    on;
    # Enable GZIP maximum compression level. Ranges from 1 to 9.
    gzip_comp_level         9;
    # Enable GZIP over HTTP 1.0 (The default is HTTP 1.1).
    gzip_http_version       1.0;
    # Disable GZIP compression for IE 1 to 6.
    gzip_disable            "MSIE [1-6]\."
    # Enable GZIP compression for the following MIME types (text/html is included by default).
    gzip_types              # Plain Text
                            text/plain
                            text/css
                            text/mathml
                            application/rtf
                            # JSON
                            application/javascript
                            application/json
                            application/manifest+json
                            application/x-web-app-manifest+json
                            text/cache-manifest
                            # XML
                            application/atom+xml
                            application/rss+xml
                            application/xslt+xml
                            application/xml
                            # Fonts
                            font/opentype
                            font/otf
                            font/truetype
                            application/font-woff
                            application/vnd.ms-fontobject
                            application/x-font-ttf
                            # Images
                            image/svg+xml
                            image/x-icon;
    # Enables inserting the 'Vary: Accept-Encoding' response header.
    gzip_vary               on;

    # Sets configuration for a virtual server. You can have multiple virtual servers.
    # See http://nginx.org/en/docs/http/ngx_http_core_module.html#server
    server {

        # Listen for requests on specified port including support for HTTP 2.0.
        # See http://nginx.org/en/docs/http/ngx_http_core_module.html#listen
        listen                      80 http2 default;
        # Or, if using HTTPS, use this:
        # listen                      443 http2 ssl default;
        # Configure SSL/TLS
        # See http://nginx.org/en/docs/http/configuring_https_servers.html
        ssl_certificate             /etc/ssl/certs/testCert.crt;
        ssl_certificate_key         /etc/ssl/certs/testCert.key;
        ssl_protocols               TLSv1.1 TLSv1.2;
        ssl_prefer_server_ciphers   on;
        ssl_ciphers                 "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
        ssl_ecdh_curve              secp384r1;
        ssl_session_cache           shared:SSL:10m;
        ssl_session_tickets         off;
        # Ensure your cert is capable before turning on SSL Stapling.
        ssl_stapling                on;
        ssl_stapling_verify         on;

        # The name of the virtual server where you can specify one or more domains that you own.
        server_name					localhost;
        # server_name    example.com www.example.com *.example.com www.example.*;

        # Match incoming requests with the following path and forward them to the specified location.
        # See http://nginx.org/en/docs/http/ngx_http_core_module.html#location
        location / {

            proxy_pass              http://localhost:1025;

            # The default minimum configuration required for ASP.NET Core
            # See https://docs.asp.net/en/latest/publishing/linuxproduction.html?highlight=nginx#configure-a-reverse-proxy-server
            proxy_cache_bypass      $http_upgrade;
            # Turn off changing the URL's in headers like the 'Location' HTTP header.
            proxy_redirect          off;
            # Forwards the Host HTTP header.
            proxy_set_header        Host $host;
            # The Kestrel web server we are forwarding requests to only speaks HTTP 1.1.
            proxy_http_version      1.1;
            proxy_set_header        Upgrade $http_upgrade;
            # Adds the 'Connection: keep-alive' HTTP header.
            proxy_set_header        Connection keep-alive;

            # Sets the maximum allowed size of the client request body.
            client_max_body_size    10m;
            # Sets buffer size for reading client request body.
            client_body_buffer_size 128k;
            # Defines a timeout for establishing a connection with a proxied server.
            proxy_connect_timeout   90;
            # Sets a timeout for transmitting a request to the proxied server.
            proxy_send_timeout      90;
            # Defines a timeout for reading a response from the proxied server.
            proxy_read_timeout      90;
            # Sets the number and size of the buffers used for reading a response from the proxied server.
            proxy_buffers           32 4k;

        }

    }

}

types {

    # An expanded list of MIME type to file extension mappings for Nginx.

    # Data Interchange
    application/atom+xml                  atom;
    application/json                      json map topojson;
    application/ld+json                   jsonld;
    application/rss+xml                   rss;
    application/vnd.geo+json              geojson;
    application/xml                       rdf xml;

    # JavaScript
    application/javascript                js;

    # Manifest files
    application/manifest+json             webmanifest;
    application/x-web-app-manifest+json   webapp;
    text/cache-manifest                   appcache;

    # Media files
    audio/midi                            mid midi kar;
    audio/mp4                             aac f4a f4b m4a;
    audio/mpeg                            mp3;
    audio/ogg                             oga ogg opus;
    audio/x-realaudio                     ra;
    audio/x-wav                           wav;
    image/x-icon                          cur ico;
    image/bmp                             bmp;
    image/gif                             gif;
    image/jpeg                            jpeg jpg;
    image/png                             png;
    image/svg+xml                         svg svgz;
    image/tiff                            tif tiff;
    image/vnd.wap.wbmp                    wbmp;
    image/webp                            webp;
    image/x-jng                           jng;
    video/3gpp                            3gp 3gpp;
    video/mp4                             f4p f4v m4v mp4;
    video/mpeg                            mpeg mpg;
    video/ogg                             ogv;
    video/quicktime                       mov;
    video/webm                            webm;
    video/x-flv                           flv;
    video/x-mng                           mng;
    video/x-ms-asf                        asf asx;
    video/x-ms-wmv                        wmv;
    video/x-msvideo                       avi;

    # Microsoft Office
    application/msword                                                         doc;
    application/vnd.ms-excel                                                   xls;
    application/vnd.ms-powerpoint                                              ppt;
    application/vnd.openxmlformats-officedocument.wordprocessingml.document    docx;
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet          xlsx;
    application/vnd.openxmlformats-officedocument.presentationml.presentation  pptx;

    # Web Fonts
    application/font-woff                 woff;
    application/font-woff2                woff2;
    application/vnd.ms-fontobject         eot;
    application/x-font-ttf                ttc ttf;
    font/opentype                         otf;

    # Other
    application/java-archive              ear jar war;
    application/mac-binhex40              hqx;
    application/octet-stream              bin deb dll dmg exe img iso msi msm msp safariextz;
    application/pdf                       pdf;
    application/postscript                ai eps ps;
    application/rtf                       rtf;
    application/vnd.google-earth.kml+xml  kml;
    application/vnd.google-earth.kmz      kmz;
    application/vnd.wap.wmlc              wmlc;
    application/x-7z-compressed           7z;
    application/x-bb-appworld             bbaw;
    application/x-bittorrent              torrent;
    application/x-chrome-extension        crx;
    application/x-cocoa                   cco;
    application/x-java-archive-diff       jardiff;
    application/x-java-jnlp-file          jnlp;
    application/x-makeself                run;
    application/x-opera-extension         oex;
    application/x-perl                    pl pm;
    application/x-pilot                   pdb prc;
    application/x-rar-compressed          rar;
    application/x-redhat-package-manager  rpm;
    application/x-sea                     sea;
    application/x-shockwave-flash         swf;
    application/x-stuffit                 sit;
    application/x-tcl                     tcl tk;
    application/x-x509-ca-cert            crt der pem;
    application/x-xpinstall               xpi;
    application/xhtml+xml                 xhtml;
    application/xslt+xml                  xsl;
    application/zip                       zip;
    text/css                              css;
    text/html                             htm html shtml;
    text/mathml                           mml;
    text/plain                            txt;
    text/vcard                            vcard vcf;
    text/vnd.rim.location.xloc            xloc;
    text/vnd.sun.j2me.app-descriptor      jad;
    text/vnd.wap.wml                      wml;
    text/vtt                              vtt;
    text/x-component                      htc;

}
```

# NGINX Modules

Like IIS, NGINX has modules that you can add to it, to provide extra features. There are a number of them out there. I've listed two that I care about and you should too.

Installing modules is best done by downloading the NGINX source, as well as the modules you need and then compiling the application. There is a feature called [dynamic modules](https://www.nginx.com/blog/dynamic-modules-nginx-1-9-11/) which lets you dynamically load additional separate modules after installing NGINX but the link suggests third party modules may not be supported so I didn't try it out.

## HTTP 2.0

The [ngx_http_v2_module](http://nginx.org/en/docs/http/ngx_http_v2_module.html) module lets you use [HTTP 2.0](https://en.wikipedia.org/wiki/HTTP/2). HTTP 2.0 gives your site a very rough ~3-5% performance boost and that's before using any of it's more advanced features which not many people are using yet.

## Brotli Compression

The [ngx_brotli](http://ngx_brotli) module lets NGINX use the [Brotli](https://en.wikipedia.org/wiki/Brotli) compression algorithm. If you haven't heard about Brotli, you should take note. Brotli is a compression algorithm built by Google and is perhaps set to take over from GZIP as the compression algorithm of the web. It's already [fully supported](http://caniuse.com/#search=brotli) on Firefox, Chrome and Opera with only Edge lagging behind.

Depending on how much extra CPU power you are wanting to use (it can max out your CPU at the highest compression levels, which could DoS your site if someone makes too many requests, so be careful what compression level you choose), Brotli can compress files and save you around 10-20% bandwidth over what GZIP can do! Those are some significant savings.

# .NET Boxed

I've updated the [.NET Boxed](https://github.com/Dotnet-Boxed/Templates/) project template, so you can now choose the web server (IIS or NGINX) you want to use. If you choose to use NGINX, you can have it pre-configured just for you, right out of the box.

# Conclusions

The main reason, I've been taking a serious look at NGINX is hard cash. Running Linux servers in the cloud can costs around half the price of a Windows server. Also, you can nab yourself some pretty big performance wins by using the modules I've listed.

There are some interesting overlaps between ASP.NET Core and NGINX. Both can be used to serve static files, HTTP headers, GZIP files etc. I think ASP.NET Core is slowly going to take on more of the role that traditionally was the preserve of the web server.

The cool thing is that because ASP.NET Core is just C#, we'll have a lot of power to configure things using code. NGINX lets you do more advanced configuration using the Lua language and soon even in JavaScript but putting that logic in the app where it belongs and where you can do powerful things makes sense to me.
