# Hubble UI

Hubble UI is open source user interface for [Cilium Hubble](https://github.com/cilium/hubble).

## Installation

Hubble UI is installed as part of hubble, please see [Hubble Getting Started Guide](https://docs.cilium.io/en/latest/gettingstarted/hubble/#deploy-cilium-and-hubble) for details.

## Why Hubble UI?

Troubleshooting microservices application connectivity is a challenging task. Simply looking at "kubectl get pods" does not indicate dependencies between each service or external APIs or databases.

Hubble UI enables zero-effort automatic discovery of the service dependency graph for Kubernetes Clusters at L3/L4 and even L7, allowing user-friendly visualization and filtering of those dataflows as a Service Map.

See [Hubble Getting Started Guide](https://docs.cilium.io/en/latest/gettingstarted/hubble/#deploy-cilium-and-hubble) for details.

![Service Map](promo/servicemap.png)

### Development

1. Install deps: `npm install`
2. Forward port: `kubectl port-forward -n kube-system deployment/hubble-ui 8081`. It allows local app to access hubble-relay.
3. Start development server on port 8080: `npm run watch`
4. Open [http://localhost:8080](http://localhost:8080)

## Community

Learn more about [Cilium Community](https://github.com/cilium/cilium#community)

## License

Hubble UI is [Apache License, Version 2.0](https://github.com/cilium/hubble-ui/blob/master/LICENSE)
