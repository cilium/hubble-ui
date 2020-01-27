// Copyright 2019 Authors of Hubble
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import * as k8s from "@kubernetes/client-node";
import * as yaml from "js-yaml";
import * as jsonwebtoken from "jsonwebtoken";
import * as request from "request";
import { K8sPod } from "../collector_service_pb";
import {
  CiliumEndpoint,
  CiliumNetworkPolicy,
  KubernetesNetworkPolicy
} from "../graphqlTypes";
import { cepJsonToGraphqlType } from "../utils";

const isObject = (x: any): boolean => typeof x === "object";

export const createClusterApi = () => {
  const config = new k8s.KubeConfig();
  config.loadFromDefault();

  const cluster = config.getCurrentCluster();
  if (!cluster) {
    throw new Error("No current cluster in config");
  }
  const requestOpts: any = {};
  config.applyToRequest(requestOpts);

  return {
    requestOpts,
    cluster,
    client: config.makeApiClient(k8s.CoreV1Api),
    serviceAccountName: "",
    serviceAccountNamespace: ""
  };
};

export const createUserApi = (token: string) => {
  const decodedToken = jsonwebtoken.decode(token, { complete: true });
  const serviceAccountName =
    decodedToken.payload["kubernetes.io/serviceaccount/service-account.name"];
  const serviceAccountNamespace =
    decodedToken.payload["kubernetes.io/serviceaccount/namespace"];

  const config = new k8s.KubeConfig();
  config.loadFromDefault();
  const cluster = config.getCurrentCluster();
  if (!cluster) {
    throw new Error("No current cluster in config");
  }
  config.users = [{ name: serviceAccountName, token }];
  config.contexts = [
    {
      cluster: cluster.name,
      user: serviceAccountName,
      name: config.getCurrentContext()
    }
  ];

  const requestOpts: any = {};
  config.applyToRequest(requestOpts);

  return {
    requestOpts,
    cluster,
    client: config.makeApiClient(k8s.CoreV1Api),
    serviceAccountName,
    serviceAccountNamespace
  };
};

export const createEnvApi = (token: string) => {
  return createClusterApi();
};

export const getNamespacesList = () => {
  return createClusterApi()
    .client.listNamespace()
    .then(result => {
      return result.body.items
        .filter(item => Boolean(item.metadata && item.metadata.name))
        .map(item => item.metadata!.name!);
    })
    .catch(handlek8sClientFailure.bind(null, "namespaces"));
};

export const getHasAccessToNamespace = (token: string, namespace: string) => {
  return new Promise<boolean>((resolve, reject) => {
    const api = createEnvApi(token);
    const url = `${api.cluster.server}/apis/authorization.k8s.io/v1/selfsubjectaccessreviews`;
    request(
      {
        ...api.requestOpts,
        url,
        method: "POST",
        json: true,
        body: {
          apiVersion: "authorization.k8s.io/v1",
          kind: "SelfSubjectAccessReview",
          spec: {
            resourceAttributes: {
              namespace,
              verb: "list",
              resource: "pods"
            }
          }
        }
      },
      (error, response, body) => {
        if (handleRestFailure("rbac", error, response, reject)) {
          return;
        }
        if (!body || !isObject(body) || !isObject(body.status)) {
          return reject(
            new Error("Can't check access to resources via k8s rest api")
          );
        }
        try {
          return resolve(body.status.allowed);
        } catch (error) {
          return reject(error);
        }
      }
    );
  });
};

export const getPodListForNamespace = (
  token: string,
  namespace: string
): Promise<K8sPod[]> => {
  return createEnvApi(token)
    .client.listNamespacedPod(namespace)
    .then(result => {
      if (
        !result.body ||
        !isObject(result.body) ||
        !Array.isArray(result.body.items)
      ) {
        throw new Error("Can't fetch pods via k8s rest api");
      }
      return result.body.items.map<K8sPod>(item => {
        return ({
          hasMetadata: () => Boolean(item.metadata),
          getMetadata: () => ({
            getName: () => (item.metadata ? item.metadata.name : undefined),
            getNamespace: () =>
              item.metadata ? item.metadata.namespace : undefined,
            getUid: () => (item.metadata ? item.metadata.uid : undefined)
          }),
          hasSpec: () => Boolean(item.spec),
          getSpec: () => ({
            getContainersList: () => {
              if (!item.spec) {
                return [];
              }
              return item.spec.containers.map(container => ({
                getName: () => container.name,
                getPortsList: () => {
                  if (!container.ports) {
                    return [];
                  }
                  return container.ports.map(port => ({
                    getProtocol: () => port.protocol,
                    getContainerPort: () => port.containerPort
                  }));
                }
              }));
            }
          })
        } as any) as K8sPod;
      });
    })
    .catch(handlek8sClientFailure.bind(null, "pods"));
};

export const getServicesForNamespace = (token: string, namespace: string) => {
  return createEnvApi(token)
    .client.listNamespacedService(namespace)
    .then(result => {
      if (
        !result.body ||
        !isObject(result.body) ||
        !Array.isArray(result.body.items)
      ) {
        throw new Error("Can't fetch services via k8s rest api");
      }
      return result.body;
    })
    .catch(handlek8sClientFailure.bind(null, "services"));
};

export const getK8SEndpointsForNamespace = (
  token: string,
  namespace: string
) => {
  return createEnvApi(token)
    .client.listNamespacedEndpoints(namespace)
    .then(result => {
      if (
        !result.body ||
        !isObject(result.body) ||
        !Array.isArray(result.body.items)
      ) {
        throw new Error("Can't fetch k8s endpoints via k8s rest api");
      }
      return result.body;
    })
    .catch(handlek8sClientFailure.bind(null, "k8s endpoints"));
};

export const getCiliumEndpointsForNamespace = (
  token: string,
  namespace: string
) => {
  assertNamespace(namespace);
  return new Promise<CiliumEndpoint[]>((resolve, reject) => {
    const api = createEnvApi(token);
    const url = `${api.cluster.server}/apis/cilium.io/v2/namespaces/${namespace}/ciliumendpoints`;
    request.get(url, api.requestOpts, async (error, response, body) => {
      if (handleRestFailure("cilium endpoints", error, response, reject)) {
        return;
      }
      try {
        return resolve(await cepJsonToGraphqlType(body));
      } catch (error) {
        return reject(
          new Error(
            `Can't fetch cilium endpoints via k8s api: ${
              error ? error.toString() : ""
            }`
          )
        );
      }
    });
  });
};

export const getCiliumNetworkPolicies = (token: string) => {
  return new Promise<CiliumNetworkPolicy[]>((resolve, reject) => {
    const api = createEnvApi(token);
    const url = `${api.cluster.server}/apis/cilium.io/v2/ciliumnetworkpolicies`;
    request.get(url, api.requestOpts, (error, response, body) => {
      if (
        handleRestFailure("cilium network policies", error, response, reject)
      ) {
        return;
      }
      try {
        const list: CiliumNetworkPolicy[] = JSON.parse(body).items.map(
          item => ({
            __typename: "CiliumNetworkPolicy",
            namespace: item.metadata.namespace,
            name: item.metadata.name,
            creationTimestamp: item.metadata.creationTimestamp,
            yaml: yaml.safeDump(item.specs || item.spec, { noRefs: true })
          })
        );
        return resolve(list);
      } catch (error) {
        return reject(
          new Error(
            `Can't fetch cilium network policies via k8s api: ${
              error ? error.toString() : ""
            }`
          )
        );
      }
    });
  });
};

export const getKubernetesNetworkPolicies = (token: string) => {
  return new Promise<KubernetesNetworkPolicy[]>((resolve, reject) => {
    const api = createEnvApi(token);
    const url = `${api.cluster.server}/apis/networking.k8s.io/v1/networkpolicies`;
    request.get(url, api.requestOpts, (error, response, body) => {
      if (handleRestFailure("k8s network policies", error, response, reject)) {
        return;
      }
      try {
        const list: KubernetesNetworkPolicy[] = JSON.parse(body).items.map(
          item => ({
            __typename: "KubernetesNetworkPolicy",
            namespace: item.metadata.namespace,
            name: item.metadata.name,
            creationTimestamp: item.metadata.creationTimestamp,
            yaml: yaml.safeDump(item.specs || item.spec, { noRefs: true })
          })
        );
        return resolve(list);
      } catch (error) {
        return reject(
          new Error(
            `Can't fetch k8s network policies via k8s api: ${
              error ? error.toString() : ""
            }`
          )
        );
      }
    });
  });
};

function assertNamespace(namespace) {
  if (/[^a-zA-Z0-9\-]/.test(namespace)) {
    throw new Error("Wrong namespace format");
  }
}

function handlek8sClientFailure(resourceName: string, error: any): any {
  if (
    error &&
    error.response &&
    error.response.body &&
    error.response.body.kind === "Status" &&
    error.response.body.status === "Failure" &&
    error.response.body.message
  ) {
    throw new Error(
      `Can't fetch ${resourceName} via k8s api: ${error.response.body.message}`
    );
  }
  throw new Error(
    `Can't fetch ${resourceName} via k8s api: ${
      error ? error.toString() : null
    }`
  );
}

function handleRestFailure(
  resourceName: string,
  error: any,
  response: request.Response,
  reject: (reason?: any) => any
): any {
  if (error) {
    return (
      reject(`Can't fetch ${resourceName} via k8s api: ${error.toString()}`),
      true
    );
  }
  if (response.statusCode < 200 || response.statusCode > 299) {
    return (
      reject(
        `Can't fetch ${resourceName} via k8s api. ${response.statusCode} status from ${response.request.uri.path}`
      ),
      true
    );
  }
  return false;
}
