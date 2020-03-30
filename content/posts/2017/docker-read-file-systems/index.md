---
title: "Docker Read-Only File Systems"
description: "How to use a read-only file system in Docker to secure your Docker containers using the docker run CLI command and Docker compose or docker swarm."
author: "Muhammad Rehan Saeed"
permalink: "/docker-read-file-systems/"
cover_image: "/images/hero/Docker-1366x768.png"
date: "2017-11-13"
published: true
categories:
  - "Docker"
tags:
  - "ASP.NET Core"
  - "Docker"
  - "Docker Compose"
  - "Docker Swarm"
  - "File System"
---

For a little bit of added security you can make the file system of your container read-only, excluding any volumes you may have created. If anyone hacks into your container, they will be unable to change any files.

# Docker Run

When using the docker run command using the CLI, you can simply use the following command:

```powershell
docker run --read-only redis
```

# Docker Compose/Swarm

To set a read-only file system, you simply need to set the `read_only` flag to `true`, like so:

```yaml
version: '3.3'

services:
  redis:
    image: redis:4.0.1-alpine
    networks:
      - myoverlay
    read_only: true
    
networks:
  myoverlay:
```

So above, I have a Docker stack file for use with Docker Swarm showing how to start Redis with a read-only file system.

# What is Supported?

Not all images support having them started with a read-only file system. Some require access to write temp files and the like. You can usually get away with using a volume in this case because volumes are still writeable even if you enable the read-only file system. In my research, I found it hard to determine if an image supported the feature, so I simply tried it out and found that most failed.

I discovered that Redis was the only image that I was running that had [full support](https://github.com/docker-library/redis/issues/109), several Elastic Stack containers failed to start and even my ASP.NET Core images failed to start. I since raised a GitHub issue [here](https://github.com/Microsoft/aspnet-docker/issues/66), trying to find out why the container fails to start and seeing if there is any workaround.
