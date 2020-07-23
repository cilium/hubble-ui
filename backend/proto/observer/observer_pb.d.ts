import * as jspb from "google-protobuf"

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as flow_flow_pb from '../flow/flow_pb';
import * as relay_relay_pb from '../relay/relay_pb';

export class ServerStatusRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerStatusRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ServerStatusRequest): ServerStatusRequest.AsObject;
  static serializeBinaryToWriter(message: ServerStatusRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerStatusRequest;
  static deserializeBinaryFromReader(message: ServerStatusRequest, reader: jspb.BinaryReader): ServerStatusRequest;
}

export namespace ServerStatusRequest {
  export type AsObject = {
  }
}

export class ServerStatusResponse extends jspb.Message {
  getNumFlows(): number;
  setNumFlows(value: number): ServerStatusResponse;

  getMaxFlows(): number;
  setMaxFlows(value: number): ServerStatusResponse;

  getSeenFlows(): number;
  setSeenFlows(value: number): ServerStatusResponse;

  getUptimeNs(): number;
  setUptimeNs(value: number): ServerStatusResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerStatusResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ServerStatusResponse): ServerStatusResponse.AsObject;
  static serializeBinaryToWriter(message: ServerStatusResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerStatusResponse;
  static deserializeBinaryFromReader(message: ServerStatusResponse, reader: jspb.BinaryReader): ServerStatusResponse;
}

export namespace ServerStatusResponse {
  export type AsObject = {
    numFlows: number,
    maxFlows: number,
    seenFlows: number,
    uptimeNs: number,
  }
}

export class GetFlowsRequest extends jspb.Message {
  getNumber(): number;
  setNumber(value: number): GetFlowsRequest;

  getFollow(): boolean;
  setFollow(value: boolean): GetFlowsRequest;

  getBlacklistList(): Array<flow_flow_pb.FlowFilter>;
  setBlacklistList(value: Array<flow_flow_pb.FlowFilter>): GetFlowsRequest;
  clearBlacklistList(): GetFlowsRequest;
  addBlacklist(value?: flow_flow_pb.FlowFilter, index?: number): flow_flow_pb.FlowFilter;

  getWhitelistList(): Array<flow_flow_pb.FlowFilter>;
  setWhitelistList(value: Array<flow_flow_pb.FlowFilter>): GetFlowsRequest;
  clearWhitelistList(): GetFlowsRequest;
  addWhitelist(value?: flow_flow_pb.FlowFilter, index?: number): flow_flow_pb.FlowFilter;

  getSince(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setSince(value?: google_protobuf_timestamp_pb.Timestamp): GetFlowsRequest;
  hasSince(): boolean;
  clearSince(): GetFlowsRequest;

  getUntil(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setUntil(value?: google_protobuf_timestamp_pb.Timestamp): GetFlowsRequest;
  hasUntil(): boolean;
  clearUntil(): GetFlowsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetFlowsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetFlowsRequest): GetFlowsRequest.AsObject;
  static serializeBinaryToWriter(message: GetFlowsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetFlowsRequest;
  static deserializeBinaryFromReader(message: GetFlowsRequest, reader: jspb.BinaryReader): GetFlowsRequest;
}

export namespace GetFlowsRequest {
  export type AsObject = {
    number: number,
    follow: boolean,
    blacklistList: Array<flow_flow_pb.FlowFilter.AsObject>,
    whitelistList: Array<flow_flow_pb.FlowFilter.AsObject>,
    since?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    until?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class GetFlowsResponse extends jspb.Message {
  getFlow(): flow_flow_pb.Flow | undefined;
  setFlow(value?: flow_flow_pb.Flow): GetFlowsResponse;
  hasFlow(): boolean;
  clearFlow(): GetFlowsResponse;

  getNodeStatus(): relay_relay_pb.NodeStatusEvent | undefined;
  setNodeStatus(value?: relay_relay_pb.NodeStatusEvent): GetFlowsResponse;
  hasNodeStatus(): boolean;
  clearNodeStatus(): GetFlowsResponse;

  getNodeName(): string;
  setNodeName(value: string): GetFlowsResponse;

  getTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTime(value?: google_protobuf_timestamp_pb.Timestamp): GetFlowsResponse;
  hasTime(): boolean;
  clearTime(): GetFlowsResponse;

  getResponseTypesCase(): GetFlowsResponse.ResponseTypesCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetFlowsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetFlowsResponse): GetFlowsResponse.AsObject;
  static serializeBinaryToWriter(message: GetFlowsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetFlowsResponse;
  static deserializeBinaryFromReader(message: GetFlowsResponse, reader: jspb.BinaryReader): GetFlowsResponse;
}

export namespace GetFlowsResponse {
  export type AsObject = {
    flow?: flow_flow_pb.Flow.AsObject,
    nodeStatus?: relay_relay_pb.NodeStatusEvent.AsObject,
    nodeName: string,
    time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }

  export enum ResponseTypesCase { 
    RESPONSE_TYPES_NOT_SET = 0,
    FLOW = 1,
    NODE_STATUS = 2,
  }
}

