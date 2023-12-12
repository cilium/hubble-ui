import * as notifpb from '~backend/proto/ui/notifications_pb';
import * as statuspb from '~backend/proto/ui/status_pb';

import { HubbleNode, HubbleServerStatus } from '~/domain/hubble';
import { Status, FlowStats } from '~/domain/status';
import { NoPermission, Notification } from '~/domain/notifications';

export const fromPb = (notif: notifpb.Notification): Notification | null => {
  const parsed = new Notification();

  switch (notif.notification.oneofKind) {
    case 'connState':
      parsed.connState = {
        ...notif.notification.connState,
        k8sUnavailable: notif.notification.connState.k8SUnavailable,
        k8sConnected: notif.notification.connState.k8SConnected,
      };
      break;
    case 'dataState':
      parsed.dataState = notif.notification.dataState;
      break;
    case 'status':
      parsed.status = statusFromPb(notif.notification.status) ?? void 0;
      break;
    case 'noPermission':
      parsed.noPermission = noPermissionFromPb(notif.notification.noPermission);
      break;
    case undefined:
    default:
      return null;
  }

  return parsed;
};

export const statusFromPb = (status: statuspb.GetStatusResponse): Status | null => {
  if (!status.flows) return null;
  const flowStats = status.flows;

  const serverStatus = status.serverStatus;
  if (serverStatus == null) return null;

  const flows: FlowStats = {
    perSecond: flowStats.perSecond,
  };

  const nodes =
    status.nodes?.nodes?.map(node => {
      return HubbleNode.fromPb(node);
    }) || [];

  return {
    nodes,
    status: HubbleServerStatus.fromPb(serverStatus),
    flows,
    versions: [],
  };
};

export const noPermissionFromPb = (noPerms: notifpb.NoPermission): NoPermission => {
  return {
    resource: noPerms.resource,
    error: noPerms.error,
  };
};
