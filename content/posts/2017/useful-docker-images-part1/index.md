---
title: "Useful Docker Images - Part 1"
description: "A guide to using the Docker Visualizer, Portainer and Sonatype Nexus Docker images to help manage a Docker Swarm."
author: "Muhammad Rehan Saeed"
permalink: "/useful-docker-images-part1/"
heroImage: "/images/hero/Docker-1366x768.png"
date: "2017-11-30"
dateModified: null
published: true
series: "Useful Docker Images"
seriesOrder: 1
categories:
  - "Docker"
tags:
  - "Docker"
  - "Docker Compose"
  - "Docker Swarm"
  - "Docker Visualizer"
  - "Portainer"
  - "Sonatype Nexus"
---

1. [Useful Docker Images - Administering Docker](/useful-docker-images-part1/)
2. [Useful Docker Images - The EKL-B Stack](/useful-docker-images-part2/)

I have been running Docker Swarm in production for a few API's and single page applications for a couple of months now. Here are some Docker images I've found generally useful. Most of these images are not specific to Docker Swarm. For each image, I'm also going to show a `docker-stack.yml` file that you can use to deploy the image and the settings I use for them. To deploy a Docker stack file, just run the following commands:

```powershell
# To enable Docker Swarm mode on your local machine if you haven't already.
docker swarm init
# To deploy a Docker stack file to your Swarm.
docker stack deploy --compose-file docker-stack.yml
```

# Docker Swarm Visualizer

The [Docker Swarm Visualizer](https://github.com/dockersamples/docker-swarm-visualizer) image connects to the Docker socket and shows a really nice visualization showing all of the nodes in your Docker cluster (or just one on your development machine) and all of the containers running on it.

![Docker Visualizer](./images/Docker-Visualizer.png)

A word of warning about using this image. It has full unimpeded access to your Docker socket which lets it do basically anything that Docker can do (and that's a lot). This image is useful for development and testing purposes. If you want to use it in production, don't expose it to the internet, only run it in your local network if you trust the users in your local network that is. You don't want your Docker Swarm turning into a Bitcoin mining farm. Here is a Docker stack file you can use to deploy this image:

```yaml
version: '3.3'

services: 
  visualizer:
    image: dockersamples/visualizer
    ports:
      - "8080:8080"
    deploy:
      placement:
        constraints: [node.role == manager]
      resources:
        limits:
          cpus: '0.1'
          memory: 100M
    networks:
      - visualizeroverlay
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      
networks:
  visualizeroverlay:
```

The container has to run on a manager node, so I've added that constraint and also added access to the Docker socket using a volume mount. I've also limited the resources the container can consume. Finally, I've also given the service it's own dedicated overlay network, so it can't talk to my other containers.

# Portainer

[Portainer](https://portainer.readthedocs.io/en/latest/index.html) is a free and open source Docker image you can use to administer your Docker cluster. It has full support for standalone Docker and Docker Swarm. It lets you do everything from seeing what's running on your nodes, starting containers, viewing logs and shelling into your running Docker containers. I find the last two particularly useful.

![Portainer](./images/Portainer.jpg)

Portainer also has a visualization similar to the Visualizer image I spoke about earlier but it's not nearly as nice and is buried in a few sub-menus which is why I prefer Visualizer. It's basically competing with Docker Enterprise Edition (EE) which is a seriously expensive piece of kit, while this is totally free!

Portainer has user and team management built into it, so it's not wide open to the internet if you expose a port. Interestingly, Portainer also exposes an API. It's a possibility I've explored yet but you could use said API to deploy your Docker applications from your CI/CD process. Here is a Docker stack file you can use to deploy this image:

```yaml
version: '3.3'

services: 
  portainer:
    image: portainer/portainer
    command: --host unix:///var/run/docker.sock
    deploy:
      placement:
        constraints: [node.role == manager]
    ports:
      - "9000:9000"
    networks:
      - portaineroverlay
    volumes:
      - portainer:/data
      - "/var/run/docker.sock:/var/run/docker.sock"
      
networks:
  portaineroverlay:
```

Once again, we are binding the image to the Docker socket using a volume mount but also giving Portainer another volume to store it's data. We also set a constraint, so that the container runs on a manager node.

# Sonatype Nexus

[https://hub.docker.com/r/sonatype/nexus3/](Sonatype Nexus) is an open source repository manager that can be used as a private Docker registry to store your images. In fact, it can also be used as a repository for NuGet, Maven, Ruby and NPM too. It's pretty powerful stuff and has user management built in too.

![Sonatype Nexus](./images/Sonatype-Nexus.png)

```yaml
version: '3.3'

  nexus:
    image: sonatype/nexus3:3.6.1
    deploy:
      resources:
        reservations:
          cpus: '2'
          memory: 4GB
    healthcheck:
      test: ["CMD", "curl", "--fail", "http://localhost/service/metrics/healthcheck"]
      interval: 60s
      timeout: 5s
      retries: 3
    ports:
      - "8081:8081"
      - "8082:8082"
      - "8083:8083"
    networks:
      - nexusoverlay
    volumes:
      - artefacts:/nexus-data

networks:
  nexusoverlay:
```

Sonatype Nexus has some pretty hefty minimum system requirements, so I've reserved the necessary CPU and memory. I've added three ports to support HTTP, HTTPS and a third port for my Docker registry, you can configure this in the admin menu when you add a Docker registry. Thankfully it's just a matter of a few clicks to setup and here are my registry settings:

![Sonatype Nexus Administration](./images/Sonatype-Nexus-Administration.png)

I have also gone to the effort of setting up a health check. Health checks are a wonderful feature of Docker. The container will not start and join the network until the health check has succeeded. This has stopped failed production releases for me in the past for my ASP.NET Core apps. Use health checks people!

# Conclusions

This blog post is getting a bit long, so I'll split it into two pieces. In the next part, expect to hear about how you can use the ELK-B stack which is made up of a few bits of software: ElasticSearch, Kibana, Filebeat, Metricbeat and Heartbeat. Also, be sure to read Andrew Lock's piece on [Rancher](https://andrewlock.net/home-home-on-the-range-installing-kubernetes-using-rancher-2-0/), which is a bit like Portainer. I'd never heard of Rancher, it'll be interesting to do a comparison.
