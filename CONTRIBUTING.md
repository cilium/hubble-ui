# Contributing to Hubble-UI

`hubble-ui` is an open source project licensed under [Apache-2.0](LICENSE). Everybody is welcome to contribute. Contributors are required to follow the [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md).

## Getting Started

- Read the [README](https://github.com/cilium/hubble-ui/blob/master/README.md) to understand how `hubble-ui` works and its use cases.
- Check out the [issues list](https://github.com/cilium/hubble-ui/issues) for open tasks.

## 🛠 Development

### Backend

If you want to point the frontend to a backend deployed in Minikube, simply create a port forward.

```shell
kubectl port-forward -n kube-system deployment/hubble-ui 8081
```

To make changes to the Go backend, there are additional steps.

1. Go to the 📁 `backend` directory and execute `./ctl.sh`.

   ```shell
   cd ./backend
   ./ctl.sh run
   ```

   Wait until the build and server are running.

2. In a separate terminal, enter the 📁 `server` directory containing the Envoy config.

   ```shell
   cd ./server
   ```

   Assuming Envoy has already been installed, execute:

   ```shell
   envoy -c ./envoy.yaml
   ```

3. In a separate terminal, run a port forward to Hubble Relay.

   ```shell
   kubectl port-forward -n kube-system deployment/hubble-relay 50051:4245
   ```

#### Docker 🐳

Build the backend Docker image:

```shell
make hubble-ui-backend
```

### Frontend

1. Install dependencies.

```shell
npm install
```

2. Start the development server.

```shell
npm run watch
```

3. Open [http://localhost:8080](http://localhost:8080)

#### Docker 🐳

Build the frontend Docker image:

```shell
make hubble-ui
```

## Contributor Ladder  

The Cilium project has a well-defined [contributor ladder](https://github.com/cilium/community/blob/main/CONTRIBUTOR-LADDER.md) to help community members grow both responsibilities and privileges in the project ecosystem. This ladder outlines the path from an occasional contributor to a committer, detailing expectations at each stage. Most contributors start at the community level in a sub-project and progress as they become more engaged in the project ecosystem. We encourage you to take an active role, and the community is here to support you on this journey.  

Becoming a [Cilium organization member](https://github.com/cilium/community/blob/main/CONTRIBUTOR-LADDER.md#organization-member) grants you additional privileges across the project ecosystem, such as the ability to leave reviews on a PR or trigger CI runs. If you're contributing regularly to `hubble-ui`, consider joining the [hubble-ui team](https://github.com/cilium/community/blob/main/ladder/teams/hubble-ui.yaml) to help review code and accelerate development. Your contributions play a vital role in improving the project, and we'd love to have you more involved!

## Community

Join the Cilium community for discussions:

Slack: [Cilium Slack](https://slack.cilium.io/) in #dev-hubble and #hubble

We appreciate your contributions to `hubble-ui` and look forward to your involvement!
