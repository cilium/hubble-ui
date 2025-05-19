<h1 align="center">Hubble UI</h1>
<p align="center">
  Hubble UI is an open-source user interface for <a href="https://github.com/cilium/hubble">Cilium Hubble</a>.
</p>

## 🚀 Installation

Hubble UI is installed as part of Hubble. Please see the Hubble [Getting Started Guide](https://docs.cilium.io/en/stable/gettingstarted/hubble/#deploy-cilium-and-hubble) for instructions.

## 🌐 Why Hubble UI?

Troubleshooting microservices application connectivity is a challenging task. Simply looking at `kubectl get pods` does not indicate dependencies between each service, external APIs, or databases.

Hubble UI enables zero-effort automatic discovery of the service dependency graph for Kubernetes Clusters at L3/L4 and even L7, allowing user-friendly visualization and filtering of those dataflows as a Service Map.

See [Hubble Getting Started Guide](https://docs.cilium.io/en/stable/gettingstarted/hubble/#deploy-cilium-and-hubble) for details.

![Service Map](promo/servicemap.png)

## 🐝 Community

Learn more about the [Cilium community](https://github.com/cilium/cilium#community).

## 🌏 Releases

Push a tag into GitHub and ping a maintainer to accept the [GitHub action run](https://github.com/cilium/hubble-ui/actions) which pushes the built images into the official repositories.

## ⚖️ License

[Apache License, Version 2.0](https://github.com/cilium/hubble-ui/blob/master/LICENSE)
