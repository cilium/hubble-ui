import { Status } from '~/domain/status';
import { NoPermission } from './no-permission';

export type AuthState = {
  invalid: boolean;
};

export interface Notification {
  connState?: {
    connected: boolean;
    reconnecting: boolean;
    k8sUnavailable: boolean;
    k8sConnected: boolean;
  };

  dataState?: {
    noActivity: boolean;
  };

  status?: Status;
  noPermission?: NoPermission;
  authState?: AuthState;
}

export { NoPermission };
