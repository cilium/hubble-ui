import {
  Notification as PBNotification,
  NoPermission as PBNoPermission,
} from '~backend/proto/ui/notifications_pb';
import { GetStatusResponse as PBStatusResponse } from '~backend/proto/ui/status_pb';

import { Status, FlowStats, NodeStatus } from '~/domain/status';
import { Notification, NoPermission } from '~/domain/notifications';

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

  if (notif.hasNoPermission()) {
    const noPermission = noPermissionFromPb(notif.getNoPermission()!);

    return { noPermission };
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

export const noPermissionFromPb = (noPerms: PBNoPermission): NoPermission => {
  return {
    resource: noPerms.getResource(),
    error: noPerms.getError(),
  };
};
