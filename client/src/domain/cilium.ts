import { ReservedLabel } from './labels';

export const reserved = {
  host: { id: 1, label: ReservedLabel.Host },
  world: { id: 2, label: ReservedLabel.World },
  unmanaged: { id: 3, label: ReservedLabel.Unmanaged },
  health: { id: 4, label: ReservedLabel.Health },
  init: { id: 5, label: ReservedLabel.Init },
  remoteNode: { id: 6, label: ReservedLabel.RemoteNode },
};

export enum CiliumEventTypes {
  UNSPEC = 0,
  DROP = 1,
  DEBUG = 2,
  CAPTURE = 3,
  TRACE = 4,
  L7 = 129,
  AGENT = 130,
}

export const CiliumEventTypesCodes = {
  [CiliumEventTypes.UNSPEC]: CiliumEventTypes.UNSPEC,
  [CiliumEventTypes.DROP]: CiliumEventTypes.DROP,
  [CiliumEventTypes.DEBUG]: CiliumEventTypes.DEBUG,
  [CiliumEventTypes.CAPTURE]: CiliumEventTypes.CAPTURE,
  [CiliumEventTypes.TRACE]: CiliumEventTypes.TRACE,
  [CiliumEventTypes.L7]: CiliumEventTypes.L7,
  [CiliumEventTypes.AGENT]: CiliumEventTypes.AGENT,
};

export enum CiliumEventSubTypes {
  TO_ENDPOINT = 'to-endpoint',
  TO_PROXY = 'to-proxy',
  TO_HOST = 'to-host',
  TO_STACK = 'to-stack',
  TO_OVERLAY = 'to-overlay',
  FROM_ENDPOINT = 'from-endpoint',
  FROM_PROXY = 'from-proxy',
  FROM_HOST = 'from-host',
  FROM_STACK = 'from-stack',
  FROM_OVERLAY = 'from-overlay',
  FROM_NETWORK = 'from-network',
}

export const CiliumEventSubTypesCodes = {
  0: CiliumEventSubTypes.TO_ENDPOINT,
  1: CiliumEventSubTypes.TO_PROXY,
  2: CiliumEventSubTypes.TO_HOST,
  3: CiliumEventSubTypes.TO_STACK,
  4: CiliumEventSubTypes.TO_OVERLAY,
  5: CiliumEventSubTypes.FROM_ENDPOINT,
  6: CiliumEventSubTypes.FROM_PROXY,
  7: CiliumEventSubTypes.FROM_HOST,
  8: CiliumEventSubTypes.FROM_STACK,
  9: CiliumEventSubTypes.FROM_OVERLAY,
  10: CiliumEventSubTypes.FROM_NETWORK,
};
