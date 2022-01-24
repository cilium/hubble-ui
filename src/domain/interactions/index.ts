import * as mobx from 'mobx';
import { Status } from '~/domain/status';

export enum DataMode {
  RealtimeStreaming = 'realtime-streaming',
  Disabled = 'disabled',
}

export enum ConnectionState {
  Receiving = 'receiving',
  Reconnecting = 'reconnecting',
  ReconnectDelay = 'reconnect-delay',
  ReconnectFailed = 'reconnect-failed',
  Stopped = 'stopped',
  Idle = 'idle',
}

export class TransferState {
  public dataMode: DataMode;
  public connectionState: ConnectionState;
  public reconnectingInMs?: number;
  public deploymentStatus: Status | null;

  constructor() {
    this.dataMode = DataMode.Disabled;
    this.connectionState = ConnectionState.Idle;
    this.reconnectingInMs = void 0;
    this.deploymentStatus = null;

    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  // NOTE: this method sets stable connection state
  public setStable() {
    this.setReceiving();
  }

  public setDataMode(mode: DataMode) {
    this.dataMode = mode;
  }

  public disable() {
    this.setDataMode(DataMode.Disabled);
    this.setConnectionState(ConnectionState.Idle);
  }

  public switchToRealtimeStreaming() {
    this.setDataMode(DataMode.RealtimeStreaming);
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

  public setWaitingForReconnect(ms?: number) {
    this.setConnectionState(ConnectionState.ReconnectDelay);

    if (ms != null) {
      this.reconnectingInMs = ms;
    }
  }

  public setReconnectFailed() {
    this.setConnectionState(ConnectionState.ReconnectFailed);
  }

  public setConnectionState(state: ConnectionState) {
    this.connectionState = state;
  }

  public setDeploymentStatus(st: Status | null) {
    this.deploymentStatus = st;
  }

  public get reconnectingInSeconds(): number | null {
    if (this.reconnectingInMs == null) return null;

    return this.reconnectingInMs / 1000;
  }

  // NOTE: dataMode getters
  public get isRealtimeStreaming(): boolean {
    return this.dataMode === DataMode.RealtimeStreaming;
  }

  public get isDisabled(): boolean {
    return this.dataMode === DataMode.Disabled;
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

  public get isWaitingForReconnect(): boolean {
    return this.connectionState === ConnectionState.ReconnectDelay;
  }

  public get isReconnectDelay() {
    return this.isWaitingForReconnect;
  }

  public get isReconnectFailed() {
    return this.connectionState === ConnectionState.ReconnectFailed;
  }

  public get isStopped(): boolean {
    return this.connectionState === ConnectionState.Stopped;
  }
}
