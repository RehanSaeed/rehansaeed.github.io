---
title: "Docker Labels in Depth"
description: "How to use Docker Labels with Docker run, Docker compose and Docker Swarm. Also talk about naming conventions and the Open Containers Initiative (OCI) spec."
author: "Muhammad Rehan Saeed"
permalink: "/docker-labels-depth/"
cover_image: "/images/hero/Docker-1366x768.png"
date: "2017-11-20"
dateModified: null
published: true
categories:
  - "Docker"
tags:
  - "Docker"
  - "Docker Compose"
  - "Docker Swarm"
  - "Labels"
  - "Naming Conventions"
  - "Open Containers Initiative (OCI)"
---

# Static Docker Labels

Docker image names are short and usually not very descriptive. You have the ability to label your Docker images to give them some extra metadata. You can add any information you like, labels are just key value pairs. Here I've added an author label to my Dockerfile:

```dockerfile
FROM microsoft/aspnetcore:2.0
LABEL "author"="Muhammad Rehan Saeed"
LABEL "company"="Acme Co."
ARG source
WORKDIR /app
EXPOSE 80
COPY ${source:-obj/Docker/publish} .
ENTRYPOINT ["dotnet", "Bridge.Turtle.dll"]
```

Note that prior to Docker `1.10`, it was recommended to combine all labels into a single `LABEL` instruction, to prevent extra layers from being created. This is no longer necessary, but combining labels is still supported.

# Dynamic Docker Labels

This is great for static data like the author but not so great for dynamic data like an automated build number or git changeset number that you might want to use. That way you'll know exactly which build built the image and the source code it was built from. This can be valuable information when you're in a pickle with a production issue.

To add dynamic labels you can pass them from the command line when you run the docker build command like so:

```powershell
docker image build --tag foo:1.0.0 --label "build"="123" --label "changeset"="0d9c7d3b77817caab3977b16d1d76bb3eb024837" .
```

# Open Containers Annotations Spec

The [Open Containers Initiative (OCI)](https://www.opencontainers.org/) is a standards body defining open standards for container formats and runtimes. They've already defined a [standard set of labels](https://github.com/opencontainers/image-spec/blob/master/annotations.md) (they call them annotations) for you to use in your Docker images:

- **org.opencontainers.image.created** - date and time on which the image was built (string, date-time as defined by [RFC 3339](https://tools.ietf.org/html/rfc3339#section-5.6)).
- **org.opencontainers.image.authors** - Contact details of the people or organization responsible for the image (free-form string).
- **org.opencontainers.image.url** - URL to find more information on the image (string).
- **org.opencontainers.image.documentation** - URL to get documentation on the image (string).
- **org.opencontainers.image.source** - URL to get source code for building the image (string).
- **org.opencontainers.image.version** - Version of the packaged software.
    - The version MAY match a label or tag in the source code repository.
    - Version MAY be [Semantic versioning-compatible](http://semver.org/).
- **org.opencontainers.image.revision** - Source control revision identifier for the packaged software.
- **org.opencontainers.image.vendor** - Name of the distributing entity, organization or individual.
- **org.opencontainers.image.licenses** - License(s) under which contained software is distributed as an SPDX License Expression.
- **org.opencontainers.image.ref.name** - Name of the reference for a target (string).
- **org.opencontainers.image.title** - Human-readable title of the image (string).
- **org.opencontainers.image.description** - Human-readable description of the software packaged in the image (string).

# Naming Conventions

The labels in the Open Containers Annotations specification and a few others I've seen use a kind of dot separated namespace. The official Docker documentation suggests that this is only required if your image is a "third party tool" which I think means if the image will ever be used as a base for another image:

- Authors of third-party tools should prefix each label key with the reverse DNS notation of a domain they own, such as `com.example.some-label`.
- Do not use a domain in your label key without the domain owner's permission.
- The `com.docker.*`, `io.docker.*`, and `org.dockerproject.*` namespaces are reserved by Docker for internal use.
- Label keys should begin and end with a lower-case letter and should only contain lower-case alphanumeric characters, the period character (`.`), and the hyphen character (`-`). Consecutive periods or hyphens are not allowed.
- The period character (`.`) separates namespace "fields". Label keys without namespaces are reserved for CLI use, allowing users of the CLI to interactively label Docker objects using shorter typing-friendly strings.

For any other images, you can just use simple single word labels or at least, that's what I'm doing.
