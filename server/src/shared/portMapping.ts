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
export type AppProtocolTuple = [
  string | null, //l7Protocol
  string | null // appProtocol
];

export const supportedL7 = ["http", "grpc", "kafka"];

export const l7ProtocolMapping = {
  // all other protocols, with l4 only yet
  cassandra: [null, 9042],
  couchdb: ["http", 5984],
  graphql: ["http"],
  elasticsearch: ["http", 9200],
  etcd: [null, 2379],
  grpc: ["grpc", 50051],
  http: ["http", 80, 9080, 8080, 3000, 12000],
  influxdb: [null, 8086],
  kafka: ["kafka", 9092],
  memcached: [null, 11211],
  mongodb: [null, 27017],
  mysql: [null, 3306],
  postgresql: [null, 5432],
  rabbitmq: [null, 5672],
  redis: [null, 6379],
  zookeeper: [null, 2181]
};

const portToAppMapping = Object.keys(l7ProtocolMapping).reduce(
  (accum, app): any => {
    const [l7Protocol, ...ports] = l7ProtocolMapping[app];
    ports.forEach((port: any) => {
      accum[port] = app;
    });
    return accum;
  },
  {}
);

export function portToAppProtocolTuple(
  port: any,
  l7Protocol: string | null = null
): AppProtocolTuple {
  if (l7Protocol) {
    const appProtocol = portToAppMapping[port];
    if (
      appProtocol &&
      l7ProtocolMapping[appProtocol] &&
      l7ProtocolMapping[appProtocol][0] === l7Protocol
    ) {
      return [l7Protocol, appProtocol];
    }
    return [l7Protocol, l7Protocol];
  } else {
    const appProtocol = portToAppMapping[port];
    return [
      appProtocol && l7ProtocolMapping[appProtocol]
        ? l7ProtocolMapping[appProtocol][0]
        : null,
      appProtocol || null
    ];
  }
}

export function getL7Protocol(portName: string): string {
  const index = portName.indexOf("-");
  const protocol = index < 0 ? portName : portName.slice(0, index);
  return supportedL7.find(element => element === protocol) ? protocol : "";
}

export function getL7ProtocolFromApplicationProtocol(
  appProtocol: string
): string | null {
  return l7ProtocolMapping[appProtocol.toLocaleLowerCase()]
    ? l7ProtocolMapping[appProtocol.toLocaleLowerCase()][0]
    : null;
}
