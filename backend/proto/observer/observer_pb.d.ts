import * as jspb from 'google-protobuf'

import * as google_protobuf_any_pb from 'google-protobuf/google/protobuf/any_pb';
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_field_mask_pb from 'google-protobuf/google/protobuf/field_mask_pb';
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

  getNumConnectedNodes(): google_protobuf_wrappers_pb.UInt32Value | undefined;
  setNumConnectedNodes(value?: google_protobuf_wrappers_pb.UInt32Value): ServerStatusResponse;
  hasNumConnectedNodes(): boolean;
  clearNumConnectedNodes(): ServerStatusResponse;

  getNumUnavailableNodes(): google_protobuf_wrappers_pb.UInt32Value | undefined;
  setNumUnavailableNodes(value?: google_protobuf_wrappers_pb.UInt32Value): ServerStatusResponse;
  hasNumUnavailableNodes(): boolean;
  clearNumUnavailableNodes(): ServerStatusResponse;

  getUnavailableNodesList(): Array<string>;
  setUnavailableNodesList(value: Array<string>): ServerStatusResponse;
  clearUnavailableNodesList(): ServerStatusResponse;
  addUnavailableNodes(value: string, index?: number): ServerStatusResponse;

  getVersion(): string;
  setVersion(value: string): ServerStatusResponse;

  getFlowsRate(): number;
  setFlowsRate(value: number): ServerStatusResponse;

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
    numConnectedNodes?: google_protobuf_wrappers_pb.UInt32Value.AsObject,
    numUnavailableNodes?: google_protobuf_wrappers_pb.UInt32Value.AsObject,
    unavailableNodesList: Array<string>,
    version: string,
    flowsRate: number,
  }
}

export class GetFlowsRequest extends jspb.Message {
  getNumber(): number;
  setNumber(value: number): GetFlowsRequest;

  getFirst(): boolean;
  setFirst(value: boolean): GetFlowsRequest;

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

  getExperimental(): GetFlowsRequest.Experimental | undefined;
  setExperimental(value?: GetFlowsRequest.Experimental): GetFlowsRequest;
  hasExperimental(): boolean;
  clearExperimental(): GetFlowsRequest;

  getExtensions(): google_protobuf_any_pb.Any | undefined;
  setExtensions(value?: google_protobuf_any_pb.Any): GetFlowsRequest;
  hasExtensions(): boolean;
  clearExtensions(): GetFlowsRequest;

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
    first: boolean,
    follow: boolean,
    blacklistList: Array<flow_flow_pb.FlowFilter.AsObject>,
    whitelistList: Array<flow_flow_pb.FlowFilter.AsObject>,
    since?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    until?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    experimental?: GetFlowsRequest.Experimental.AsObject,
    extensions?: google_protobuf_any_pb.Any.AsObject,
  }

  export class Experimental extends jspb.Message {
    getFieldMask(): google_protobuf_field_mask_pb.FieldMask | undefined;
    setFieldMask(value?: google_protobuf_field_mask_pb.FieldMask): Experimental;
    hasFieldMask(): boolean;
    clearFieldMask(): Experimental;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Experimental.AsObject;
    static toObject(includeInstance: boolean, msg: Experimental): Experimental.AsObject;
    static serializeBinaryToWriter(message: Experimental, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Experimental;
    static deserializeBinaryFromReader(message: Experimental, reader: jspb.BinaryReader): Experimental;
  }

  export namespace Experimental {
    export type AsObject = {
      fieldMask?: google_protobuf_field_mask_pb.FieldMask.AsObject,
    }
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

  getLostEvents(): flow_flow_pb.LostEvent | undefined;
  setLostEvents(value?: flow_flow_pb.LostEvent): GetFlowsResponse;
  hasLostEvents(): boolean;
  clearLostEvents(): GetFlowsResponse;

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
    lostEvents?: flow_flow_pb.LostEvent.AsObject,
    nodeName: string,
    time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }

  export enum ResponseTypesCase { 
    RESPONSE_TYPES_NOT_SET = 0,
    FLOW = 1,
    NODE_STATUS = 2,
    LOST_EVENTS = 3,
  }
}

export class GetAgentEventsRequest extends jspb.Message {
  getNumber(): number;
  setNumber(value: number): GetAgentEventsRequest;

  getFirst(): boolean;
  setFirst(value: boolean): GetAgentEventsRequest;

  getFollow(): boolean;
  setFollow(value: boolean): GetAgentEventsRequest;

  getSince(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setSince(value?: google_protobuf_timestamp_pb.Timestamp): GetAgentEventsRequest;
  hasSince(): boolean;
  clearSince(): GetAgentEventsRequest;

  getUntil(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setUntil(value?: google_protobuf_timestamp_pb.Timestamp): GetAgentEventsRequest;
  hasUntil(): boolean;
  clearUntil(): GetAgentEventsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAgentEventsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetAgentEventsRequest): GetAgentEventsRequest.AsObject;
  static serializeBinaryToWriter(message: GetAgentEventsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetAgentEventsRequest;
  static deserializeBinaryFromReader(message: GetAgentEventsRequest, reader: jspb.BinaryReader): GetAgentEventsRequest;
}

export namespace GetAgentEventsRequest {
  export type AsObject = {
    number: number,
    first: boolean,
    follow: boolean,
    since?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    until?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class GetAgentEventsResponse extends jspb.Message {
  getAgentEvent(): flow_flow_pb.AgentEvent | undefined;
  setAgentEvent(value?: flow_flow_pb.AgentEvent): GetAgentEventsResponse;
  hasAgentEvent(): boolean;
  clearAgentEvent(): GetAgentEventsResponse;

  getNodeName(): string;
  setNodeName(value: string): GetAgentEventsResponse;

  getTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTime(value?: google_protobuf_timestamp_pb.Timestamp): GetAgentEventsResponse;
  hasTime(): boolean;
  clearTime(): GetAgentEventsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAgentEventsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetAgentEventsResponse): GetAgentEventsResponse.AsObject;
  static serializeBinaryToWriter(message: GetAgentEventsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetAgentEventsResponse;
  static deserializeBinaryFromReader(message: GetAgentEventsResponse, reader: jspb.BinaryReader): GetAgentEventsResponse;
}

export namespace GetAgentEventsResponse {
  export type AsObject = {
    agentEvent?: flow_flow_pb.AgentEvent.AsObject,
    nodeName: string,
    time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class GetDebugEventsRequest extends jspb.Message {
  getNumber(): number;
  setNumber(value: number): GetDebugEventsRequest;

  getFirst(): boolean;
  setFirst(value: boolean): GetDebugEventsRequest;

  getFollow(): boolean;
  setFollow(value: boolean): GetDebugEventsRequest;

  getSince(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setSince(value?: google_protobuf_timestamp_pb.Timestamp): GetDebugEventsRequest;
  hasSince(): boolean;
  clearSince(): GetDebugEventsRequest;

  getUntil(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setUntil(value?: google_protobuf_timestamp_pb.Timestamp): GetDebugEventsRequest;
  hasUntil(): boolean;
  clearUntil(): GetDebugEventsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDebugEventsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetDebugEventsRequest): GetDebugEventsRequest.AsObject;
  static serializeBinaryToWriter(message: GetDebugEventsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDebugEventsRequest;
  static deserializeBinaryFromReader(message: GetDebugEventsRequest, reader: jspb.BinaryReader): GetDebugEventsRequest;
}

export namespace GetDebugEventsRequest {
  export type AsObject = {
    number: number,
    first: boolean,
    follow: boolean,
    since?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    until?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class GetDebugEventsResponse extends jspb.Message {
  getDebugEvent(): flow_flow_pb.DebugEvent | undefined;
  setDebugEvent(value?: flow_flow_pb.DebugEvent): GetDebugEventsResponse;
  hasDebugEvent(): boolean;
  clearDebugEvent(): GetDebugEventsResponse;

  getNodeName(): string;
  setNodeName(value: string): GetDebugEventsResponse;

  getTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTime(value?: google_protobuf_timestamp_pb.Timestamp): GetDebugEventsResponse;
  hasTime(): boolean;
  clearTime(): GetDebugEventsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDebugEventsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetDebugEventsResponse): GetDebugEventsResponse.AsObject;
  static serializeBinaryToWriter(message: GetDebugEventsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDebugEventsResponse;
  static deserializeBinaryFromReader(message: GetDebugEventsResponse, reader: jspb.BinaryReader): GetDebugEventsResponse;
}

export namespace GetDebugEventsResponse {
  export type AsObject = {
    debugEvent?: flow_flow_pb.DebugEvent.AsObject,
    nodeName: string,
    time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class GetNodesRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetNodesRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetNodesRequest): GetNodesRequest.AsObject;
  static serializeBinaryToWriter(message: GetNodesRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetNodesRequest;
  static deserializeBinaryFromReader(message: GetNodesRequest, reader: jspb.BinaryReader): GetNodesRequest;
}

export namespace GetNodesRequest {
  export type AsObject = {
  }
}

export class GetNodesResponse extends jspb.Message {
  getNodesList(): Array<Node>;
  setNodesList(value: Array<Node>): GetNodesResponse;
  clearNodesList(): GetNodesResponse;
  addNodes(value?: Node, index?: number): Node;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetNodesResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetNodesResponse): GetNodesResponse.AsObject;
  static serializeBinaryToWriter(message: GetNodesResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetNodesResponse;
  static deserializeBinaryFromReader(message: GetNodesResponse, reader: jspb.BinaryReader): GetNodesResponse;
}

export namespace GetNodesResponse {
  export type AsObject = {
    nodesList: Array<Node.AsObject>,
  }
}

export class Node extends jspb.Message {
  getName(): string;
  setName(value: string): Node;

  getVersion(): string;
  setVersion(value: string): Node;

  getAddress(): string;
  setAddress(value: string): Node;

  getState(): relay_relay_pb.NodeState;
  setState(value: relay_relay_pb.NodeState): Node;

  getTls(): TLS | undefined;
  setTls(value?: TLS): Node;
  hasTls(): boolean;
  clearTls(): Node;

  getUptimeNs(): number;
  setUptimeNs(value: number): Node;

  getNumFlows(): number;
  setNumFlows(value: number): Node;

  getMaxFlows(): number;
  setMaxFlows(value: number): Node;

  getSeenFlows(): number;
  setSeenFlows(value: number): Node;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Node.AsObject;
  static toObject(includeInstance: boolean, msg: Node): Node.AsObject;
  static serializeBinaryToWriter(message: Node, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Node;
  static deserializeBinaryFromReader(message: Node, reader: jspb.BinaryReader): Node;
}

export namespace Node {
  export type AsObject = {
    name: string,
    version: string,
    address: string,
    state: relay_relay_pb.NodeState,
    tls?: TLS.AsObject,
    uptimeNs: number,
    numFlows: number,
    maxFlows: number,
    seenFlows: number,
  }
}

export class TLS extends jspb.Message {
  getEnabled(): boolean;
  setEnabled(value: boolean): TLS;

  getServerName(): string;
  setServerName(value: string): TLS;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TLS.AsObject;
  static toObject(includeInstance: boolean, msg: TLS): TLS.AsObject;
  static serializeBinaryToWriter(message: TLS, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TLS;
  static deserializeBinaryFromReader(message: TLS, reader: jspb.BinaryReader): TLS;
}

export namespace TLS {
  export type AsObject = {
    enabled: boolean,
    serverName: string,
  }
}

export class GetNamespacesRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetNamespacesRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetNamespacesRequest): GetNamespacesRequest.AsObject;
  static serializeBinaryToWriter(message: GetNamespacesRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetNamespacesRequest;
  static deserializeBinaryFromReader(message: GetNamespacesRequest, reader: jspb.BinaryReader): GetNamespacesRequest;
}

export namespace GetNamespacesRequest {
  export type AsObject = {
  }
}

export class GetNamespacesResponse extends jspb.Message {
  getNamespacesList(): Array<Namespace>;
  setNamespacesList(value: Array<Namespace>): GetNamespacesResponse;
  clearNamespacesList(): GetNamespacesResponse;
  addNamespaces(value?: Namespace, index?: number): Namespace;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetNamespacesResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetNamespacesResponse): GetNamespacesResponse.AsObject;
  static serializeBinaryToWriter(message: GetNamespacesResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetNamespacesResponse;
  static deserializeBinaryFromReader(message: GetNamespacesResponse, reader: jspb.BinaryReader): GetNamespacesResponse;
}

export namespace GetNamespacesResponse {
  export type AsObject = {
    namespacesList: Array<Namespace.AsObject>,
  }
}

export class Namespace extends jspb.Message {
  getCluster(): string;
  setCluster(value: string): Namespace;

  getNamespace(): string;
  setNamespace(value: string): Namespace;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Namespace.AsObject;
  static toObject(includeInstance: boolean, msg: Namespace): Namespace.AsObject;
  static serializeBinaryToWriter(message: Namespace, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Namespace;
  static deserializeBinaryFromReader(message: Namespace, reader: jspb.BinaryReader): Namespace;
}

export namespace Namespace {
  export type AsObject = {
    cluster: string,
    namespace: string,
  }
}

export class ExportEvent extends jspb.Message {
  getFlow(): flow_flow_pb.Flow | undefined;
  setFlow(value?: flow_flow_pb.Flow): ExportEvent;
  hasFlow(): boolean;
  clearFlow(): ExportEvent;

  getNodeStatus(): relay_relay_pb.NodeStatusEvent | undefined;
  setNodeStatus(value?: relay_relay_pb.NodeStatusEvent): ExportEvent;
  hasNodeStatus(): boolean;
  clearNodeStatus(): ExportEvent;

  getLostEvents(): flow_flow_pb.LostEvent | undefined;
  setLostEvents(value?: flow_flow_pb.LostEvent): ExportEvent;
  hasLostEvents(): boolean;
  clearLostEvents(): ExportEvent;

  getAgentEvent(): flow_flow_pb.AgentEvent | undefined;
  setAgentEvent(value?: flow_flow_pb.AgentEvent): ExportEvent;
  hasAgentEvent(): boolean;
  clearAgentEvent(): ExportEvent;

  getDebugEvent(): flow_flow_pb.DebugEvent | undefined;
  setDebugEvent(value?: flow_flow_pb.DebugEvent): ExportEvent;
  hasDebugEvent(): boolean;
  clearDebugEvent(): ExportEvent;

  getNodeName(): string;
  setNodeName(value: string): ExportEvent;

  getTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTime(value?: google_protobuf_timestamp_pb.Timestamp): ExportEvent;
  hasTime(): boolean;
  clearTime(): ExportEvent;

  getResponseTypesCase(): ExportEvent.ResponseTypesCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ExportEvent.AsObject;
  static toObject(includeInstance: boolean, msg: ExportEvent): ExportEvent.AsObject;
  static serializeBinaryToWriter(message: ExportEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ExportEvent;
  static deserializeBinaryFromReader(message: ExportEvent, reader: jspb.BinaryReader): ExportEvent;
}

export namespace ExportEvent {
  export type AsObject = {
    flow?: flow_flow_pb.Flow.AsObject,
    nodeStatus?: relay_relay_pb.NodeStatusEvent.AsObject,
    lostEvents?: flow_flow_pb.LostEvent.AsObject,
    agentEvent?: flow_flow_pb.AgentEvent.AsObject,
    debugEvent?: flow_flow_pb.DebugEvent.AsObject,
    nodeName: string,
    time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }

  export enum ResponseTypesCase { 
    RESPONSE_TYPES_NOT_SET = 0,
    FLOW = 1,
    NODE_STATUS = 2,
    LOST_EVENTS = 3,
    AGENT_EVENT = 4,
    DEBUG_EVENT = 5,
  }
}

