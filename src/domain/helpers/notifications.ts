import { Notification as PBNotification } from '~backend/proto/ui/notifications_pb';
import { GetStatusResponse as PBStatusResponse } from '~backend/proto/ui/status_pb';

import { Notification } from '~/api/general/event-stream';
import { Status, FlowStats, NodeStatus } from '~/domain/status';

export const fromPb = (notif: PBNotification): Notification | null => {
  if (notif.hasConnState()) {
    const connState = notif.getConnState()!;

    return {
      connState: connState.toObject(),
    };
  }

  if (notif.hasDataState()) {
    const dataState = notif.getDataState()!;

    return {
      dataState: dataState.toObject(),
    };
  }

  if (notif.hasStatus()) {
    const status = statusFromPb(notif.getStatus()!)!;

    return {
      status,
    };
  }

  return null;
};

export const statusFromPb = (status: PBStatusResponse): Status | null => {
  if (!status.hasFlows()) return null;
  const flowStats = status.getFlows()!;

  const flows: FlowStats = {
    perSecond: flowStats.getPerSecond(),
  };

  const nodes: NodeStatus[] = status.getNodesList().map(ns => {
    return {
      name: ns.getName(),
      isAvailable: ns.getIsAvailable(),
    };
  });

  return {
    nodes,
    flows,
    versions: [],
  };
};
