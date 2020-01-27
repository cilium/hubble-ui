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
import * as React from "react";
import { Cluster, ClusterComponentStatus, PodStatus } from "../../graphqlTypes";

const css = require("./Cluster.scss");
export const isClusterHealthy = (cluster: Cluster) =>
  cluster &&
  cluster.status &&
  !cluster.status.pods.some(pod => pod.status !== ClusterComponentStatus.OK);

export const getClusterErrorStatus = (cluster: Cluster) =>
  cluster.status && cluster.status.pods && cluster.status.pods.length ? (
    <div className={css.inlineErrorMessage}>
      {cluster.status.pods.map(pod => (
        <span>{pod.error}</span>
      ))}
    </div>
  ) : (
    <div>status is unknown</div>
  );

export const getPodsStatusesByHost = (pods: PodStatus[] | null) => {
  if (!pods) {
    return null;
  }

  return pods
    .reduce((acc, cur, i, arr) => {
      if (!acc.find(({ hostname }: PodStatus) => hostname === cur.hostname)) {
        const getObj = (type: string): PodStatus | undefined =>
          arr.find(
            ({ name, hostname }) =>
              hostname === cur.hostname && name.includes(type)
          );

        return [
          ...acc,
          {
            cilium: getObj("cilium"),
            exporter: getObj("exporter"),
            agent: getObj("agent"),
            hostname: cur.hostname
          }
        ];
      }
      return acc;
    }, [])
    .sort((a, b) => {
      const statusCompare = [
        [a.agent, b.agent],
        [a.cilium, b.cilium],
        [a.exporter, b.exporter]
      ].reduce<number>((compare, [a, b]) => {
        if (compare !== 0) {
          return compare;
        }
        if (
          a &&
          a.status === ClusterComponentStatus.ERROR &&
          (!b || b.status !== ClusterComponentStatus.ERROR)
        ) {
          return -1;
        } else if (
          b &&
          b.status === ClusterComponentStatus.ERROR &&
          (!a || a.status !== ClusterComponentStatus.ERROR)
        ) {
          return 1;
        }
        return compare;
      }, 0);
      if (statusCompare !== 0) {
        return statusCompare;
      }
      return a.hostname.toLowerCase().localeCompare(b.hostname.toLowerCase());
    });
};

export const getPodsStatusesByHostByComponent = (
  pods: ReturnType<typeof getPodsStatusesByHost> | null
) => {
  interface Result {
    cilium: PodStatus[];
    exporter: PodStatus[];
    agent: PodStatus[];
  }
  if (!pods) {
    return null;
  }
  return pods.reduce<Result>(
    (acc, cur) => {
      cur.cilium && acc.cilium.push(cur.cilium);
      cur.agent && acc.agent.push(cur.agent);
      cur.exporter && acc.exporter.push(cur.exporter);
      return acc;
    },
    {
      cilium: [],
      exporter: [],
      agent: []
    }
  );
};

export const getPodsStatusesLineData = (
  pods: ReturnType<typeof getPodsStatusesByHostByComponent> | null
) => {
  if (!pods) {
    return {
      cilium: {
        status: ClusterComponentStatus.UNKNOWN,
        okCount: 0,
        totalCount: 0
      },
      exporter: {
        status: ClusterComponentStatus.UNKNOWN,
        okCount: 0,
        totalCount: 0
      },
      agent: {
        status: ClusterComponentStatus.UNKNOWN,
        okCount: 0,
        totalCount: 0
      }
    };
  }
  const groupStatuses = (podStatuses: PodStatus[]) => {
    const error = podStatuses.filter(
      status => status.status === ClusterComponentStatus.ERROR
    );
    const pending = podStatuses.filter(
      status => status.status === ClusterComponentStatus.PENDING
    );
    const unknown = podStatuses.filter(
      status => status.status === ClusterComponentStatus.UNKNOWN
    );
    const ok = podStatuses.filter(
      status => status.status === ClusterComponentStatus.OK
    );
    return { error, pending, unknown, ok };
  };
  const processStatuses = (stat: ReturnType<typeof groupStatuses>) => {
    const hasError = stat.error.length > 0;
    const hasPending = stat.pending.length > 0;
    const hasUnknown = stat.unknown.length > 0;
    return {
      status: hasError
        ? ClusterComponentStatus.ERROR
        : hasPending
        ? ClusterComponentStatus.PENDING
        : hasUnknown
        ? ClusterComponentStatus.UNKNOWN
        : ClusterComponentStatus.OK,
      okCount: stat.ok.length,
      totalCount:
        stat.error.length +
        stat.pending.length +
        stat.unknown.length +
        stat.ok.length
    };
  };
  return {
    cilium: processStatuses(groupStatuses(pods.cilium)),
    exporter: processStatuses(groupStatuses(pods.exporter)),
    agent: processStatuses(groupStatuses(pods.agent))
  };
};

export const isClusterOk = (
  statuses: ReturnType<typeof getPodsStatusesLineData>
) => {
  return (
    statuses.cilium.status === ClusterComponentStatus.OK &&
    statuses.agent.status === ClusterComponentStatus.OK &&
    statuses.exporter.status === ClusterComponentStatus.OK
  );
};

export const isClusterUnknown = (
  statuses: ReturnType<typeof getPodsStatusesLineData>
) => {
  return (
    statuses.cilium.status === ClusterComponentStatus.UNKNOWN ||
    statuses.agent.status === ClusterComponentStatus.UNKNOWN ||
    statuses.exporter.status === ClusterComponentStatus.UNKNOWN
  );
};

export const isClusterPending = (
  statuses: ReturnType<typeof getPodsStatusesLineData>
) => {
  return (
    statuses.cilium.status === ClusterComponentStatus.PENDING ||
    statuses.agent.status === ClusterComponentStatus.PENDING ||
    statuses.exporter.status === ClusterComponentStatus.PENDING
  );
};

export const isClusterError = (
  statuses: ReturnType<typeof getPodsStatusesLineData>
) => {
  return (
    statuses.cilium.status === ClusterComponentStatus.ERROR ||
    statuses.agent.status === ClusterComponentStatus.ERROR ||
    statuses.exporter.status === ClusterComponentStatus.ERROR
  );
};
