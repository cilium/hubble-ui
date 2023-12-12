import { makeAutoObservable } from 'mobx';

import { Status } from '~/domain/status';

import { ReconnectState, StreamKind } from './reconnect-state';

export enum DataMode {
  CiliumStreaming = 'cilium-streaming',
  Disabled = 'disabled',
}

export enum ConnectionState {
  Receiving = 'receiving',
  Reconnecting = 'reconnecting',
  Stopped = 'stopped',
  Idle = 'idle',
}

export interface DataModeOptions {
  liveMode?: boolean;
}

export class TransferState {
  public dataMode: DataMode;
  public connectionState: ConnectionState;

  public deploymentStatus: Status | null;

  public reconnectStates: Map<StreamKind, ReconnectState> = new Map();

  constructor() {
    this.dataMode = DataMode.Disabled;
    this.connectionState = ConnectionState.Idle;
    this.deploymentStatus = null;

    makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public updateReconnectState(
    s: StreamKind,
    cb: (old?: ReconnectState) => Partial<ReconnectState>,
  ): ReconnectState {
    const existing = this.reconnectStates.get(s);
    const updated: ReconnectState = {
      attempt: 1,
      stream: s,
      ...cb(existing || void 0),
    };

    this.reconnectStates.set(s, updated);
    return existing || updated;
  }

  public dropReconnectState(stream: StreamKind): ReconnectState | null {
    const existing = this.reconnectStates.get(stream);
    this.reconnectStates.delete(stream);

    return existing || null;
  }

  public setDataMode(mode: DataMode): boolean {
    const prev = this.dataMode;
    this.dataMode = mode;

    const isChanged = prev !== mode;
    console.log(`setting data mode: ${mode}, isChanged: ${isChanged}`);
    return isChanged;
  }

  public peekConnectionState(): ReconnectState | null {
    return [...this.reconnectStates.values()][0] || null;
  }

  public setConnectionState(state: ConnectionState) {
    this.connectionState = state;
  }

  public disable() {
    this.setDataMode(DataMode.Disabled);
    this.setConnectionState(ConnectionState.Idle);
  }

  public switchToCiliumStreaming() {
    this.setDataMode(DataMode.CiliumStreaming);
    this.setReceiving();
  }

  public setReceiving() {
    this.setConnectionState(ConnectionState.Receiving);
  }

  public setIdle() {
    this.setConnectionState(ConnectionState.Idle);
  }

  public setReconnecting() {
    this.setConnectionState(ConnectionState.Reconnecting);
  }

  public setDeploymentStatus(st: Status | null) {
    this.deploymentStatus = st;
  }

  // NOTE: dataMode getters
  public get isCiliumStreaming(): boolean {
    return this.dataMode === DataMode.CiliumStreaming;
  }

  public get isDisabled(): boolean {
    return this.dataMode === DataMode.Disabled;
  }

  public get isDeploymentStatusReady(): boolean {
    return !!this.deploymentStatus?.status.isFulfilled;
  }

  // NOTE: connectionState getters
  public get isIdle(): boolean {
    return this.connectionState === ConnectionState.Idle;
  }

  public get isReceiving(): boolean {
    return this.connectionState === ConnectionState.Receiving;
  }

  public get isReconnecting(): boolean {
    return this.connectionState === ConnectionState.Reconnecting;
  }

  public get isStopped(): boolean {
    return this.connectionState === ConnectionState.Stopped;
  }
}
