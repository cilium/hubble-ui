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

#### Backend

If you want to point frontend to backend deployed into minikube, then just do next port forward: `kubectl port-forward -n kube-system deployment/hubble-ui 8081`.

Otherwise, if you want to change something in Go backend there are additional steps:

1. Go to backend directory `cd ./backend`, execute `./ctl.sh run`, wait build and server running
2. In another terminal go to server directory with envoy config `cd ./server` and execute `envoy -c ./envoy.yaml` (envoy must be installed)
3. In another terminal do port forward to hubble-relay `kubectl port-forward -n kube-system deployment/hubble-relay 50051:4245`

#### Frontend

1. Install deps `npm install`
2. Start development server `npm run watch`
3. Open [http://localhost:8080](http://localhost:8080)

## Community

Learn more about [Cilium Community](https://github.com/cilium/cilium#community)

## License

Hubble UI is [Apache License, Version 2.0](https://github.com/cilium/hubble-ui/blob/master/LICENSE)
