import { Notification as PBNotification } from '~backend/proto/ui/notifications_pb';

import { Notification } from '~/api/general/event-stream';

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

  return null;
};
