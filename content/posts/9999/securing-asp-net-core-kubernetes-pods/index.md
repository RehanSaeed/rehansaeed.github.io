---
title: "Securing ASP.NET Core Kubernetes Pods"
description: ""
author: "Muhammad Rehan Saeed"
permalink: "/securing-asp-net-core-kubernetes-pods/"
heroImage: "/images/hero/Kubernetes-1366x768.png"
date: "2020-04-30"
dateModified: null
published: false
categories:
  - "Kubernetes"
tags:
  - "Kubernetes"
  - "Pod"
  - "Docker"
---
If you are using Kubernetes, you have a myriad of settings you can tweak under the [securityContext](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) of your `Pod` or `Deployment`. Here is a sample `Pod`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-asp-app
spec:
  securityContext:
    runAsUser: 1000
    fsGroup: 2000
  containers:
  - name: my-asp-app
    image: my-asp-app:1.0.0
    env:
      - name: COMPlus_EnableDiagnostics
        value: 0
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities: add: ["NET_ADMIN", "SYS_TIME"]
```

The `allowPrivilegeEscalation` setting stops users who manage to get into your container from escalating their privileges to become a super user. I'm not sure why any container should need this enabled. Setting this to false should be the default but it isn't, you make sure to set this yourself. This is another case of an insecure default.

In my last post in the series, I already discussed how to enable a read-only file system in your Docker container. I've already set `COMPlus_EnableDiagnostics` to zero using an environment variable and the `readOnlyRootFilesystem` is set to true to enable this feature.

The `runAsUser` and `fsGroup` settings ensure that the user and group of the user running the app is not the root user. Some Docker images I have seen do this for you and bake these settings into the Docker image while others require you to manually specify another user as above. I raised an [issue](https://github.com/dotnet/dotnet-docker/issues/940)...

capabilities...blah blah blah
