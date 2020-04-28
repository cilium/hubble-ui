export enum ReservedLabel {
  Host = 'reserved:host',
  World = 'reserved:world',
  Unmanaged = 'reserved:unmanaged',
  Health = 'reserved:health',
  Init = 'reserved:init',
  RemoteNode = 'reserved:remote-node',
}

export const reserved = {
  host: { id: 1, label: ReservedLabel.Host },
  world: { id: 2, label: ReservedLabel.World },
  unmanaged: { id: 3, label: ReservedLabel.Unmanaged },
  health: { id: 4, label: ReservedLabel.Health },
  init: { id: 5, label: ReservedLabel.Init },
  remoteNode: { id: 6, label: ReservedLabel.RemoteNode },
};

export enum CiliumEventTypes {
  DROP = 1,
  TRACE = 4,
}
