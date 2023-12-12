import { Status } from '~/domain/status';
import { NoPermission } from './no-permission';

export type AuthState = {
  invalid: boolean;
};

export class Notification {
  public connState?: {
    relayConnected: boolean;
    relayReconnecting: boolean;
    k8sUnavailable: boolean;
    k8sConnected: boolean;
  };

  public dataState?: {
    noActivity: boolean;
  };

  public status?: Status;
  public noPermission?: NoPermission;
  public authState?: AuthState;

  public get isK8sUnavailable() {
    return !!this.connState?.k8sUnavailable;
  }

  public get isK8sConnected() {
    return !!this.connState?.k8sConnected;
  }

  public get isRelayReconnecting() {
    return !!this.connState?.relayReconnecting;
  }

  public get isRelayConnected() {
    return !!this.connState?.relayConnected;
  }

  public get isNoActivityInNamespace() {
    return !!this.dataState?.noActivity;
  }

  public get isNoPermission() {
    return !!this.noPermission;
  }

  public get isRelayRelated() {
    return this.isRelayConnected || this.isRelayReconnecting;
  }

  public get isClusterRelated() {
    return this.isK8sConnected || this.isK8sUnavailable || this.isNoPermission;
  }
}

export { NoPermission };
