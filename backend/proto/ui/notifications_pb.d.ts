import * as jspb from 'google-protobuf'

import * as ui_status_pb from '../ui/status_pb';


export class Notification extends jspb.Message {
  getConnState(): ConnectionState | undefined;
  setConnState(value?: ConnectionState): Notification;
  hasConnState(): boolean;
  clearConnState(): Notification;

  getDataState(): DataState | undefined;
  setDataState(value?: DataState): Notification;
  hasDataState(): boolean;
  clearDataState(): Notification;

  getStatus(): ui_status_pb.GetStatusResponse | undefined;
  setStatus(value?: ui_status_pb.GetStatusResponse): Notification;
  hasStatus(): boolean;
  clearStatus(): Notification;

  getNoPermission(): NoPermission | undefined;
  setNoPermission(value?: NoPermission): Notification;
  hasNoPermission(): boolean;
  clearNoPermission(): Notification;

  getNotificationCase(): Notification.NotificationCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Notification.AsObject;
  static toObject(includeInstance: boolean, msg: Notification): Notification.AsObject;
  static serializeBinaryToWriter(message: Notification, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Notification;
  static deserializeBinaryFromReader(message: Notification, reader: jspb.BinaryReader): Notification;
}

export namespace Notification {
  export type AsObject = {
    connState?: ConnectionState.AsObject,
    dataState?: DataState.AsObject,
    status?: ui_status_pb.GetStatusResponse.AsObject,
    noPermission?: NoPermission.AsObject,
  }

  export enum NotificationCase { 
    NOTIFICATION_NOT_SET = 0,
    CONN_STATE = 1,
    DATA_STATE = 2,
    STATUS = 3,
    NO_PERMISSION = 4,
  }
}

export class ConnectionState extends jspb.Message {
  getConnected(): boolean;
  setConnected(value: boolean): ConnectionState;

  getReconnecting(): boolean;
  setReconnecting(value: boolean): ConnectionState;

  getK8sUnavailable(): boolean;
  setK8sUnavailable(value: boolean): ConnectionState;

  getK8sConnected(): boolean;
  setK8sConnected(value: boolean): ConnectionState;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConnectionState.AsObject;
  static toObject(includeInstance: boolean, msg: ConnectionState): ConnectionState.AsObject;
  static serializeBinaryToWriter(message: ConnectionState, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConnectionState;
  static deserializeBinaryFromReader(message: ConnectionState, reader: jspb.BinaryReader): ConnectionState;
}

export namespace ConnectionState {
  export type AsObject = {
    connected: boolean,
    reconnecting: boolean,
    k8sUnavailable: boolean,
    k8sConnected: boolean,
  }
}

export class DataState extends jspb.Message {
  getNoActivity(): boolean;
  setNoActivity(value: boolean): DataState;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DataState.AsObject;
  static toObject(includeInstance: boolean, msg: DataState): DataState.AsObject;
  static serializeBinaryToWriter(message: DataState, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DataState;
  static deserializeBinaryFromReader(message: DataState, reader: jspb.BinaryReader): DataState;
}

export namespace DataState {
  export type AsObject = {
    noActivity: boolean,
  }
}

export class NoPermission extends jspb.Message {
  getResource(): string;
  setResource(value: string): NoPermission;

  getError(): string;
  setError(value: string): NoPermission;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NoPermission.AsObject;
  static toObject(includeInstance: boolean, msg: NoPermission): NoPermission.AsObject;
  static serializeBinaryToWriter(message: NoPermission, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NoPermission;
  static deserializeBinaryFromReader(message: NoPermission, reader: jspb.BinaryReader): NoPermission;
}

export namespace NoPermission {
  export type AsObject = {
    resource: string,
    error: string,
  }
}

