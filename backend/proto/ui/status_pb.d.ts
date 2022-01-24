import * as jspb from 'google-protobuf'



export class GetStatusRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetStatusRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetStatusRequest): GetStatusRequest.AsObject;
  static serializeBinaryToWriter(message: GetStatusRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetStatusRequest;
  static deserializeBinaryFromReader(message: GetStatusRequest, reader: jspb.BinaryReader): GetStatusRequest;
}

export namespace GetStatusRequest {
  export type AsObject = {
  }
}

export class GetStatusResponse extends jspb.Message {
  getNodesList(): Array<NodeStatus>;
  setNodesList(value: Array<NodeStatus>): GetStatusResponse;
  clearNodesList(): GetStatusResponse;
  addNodes(value?: NodeStatus, index?: number): NodeStatus;

  getVersionsList(): Array<DeployedComponent>;
  setVersionsList(value: Array<DeployedComponent>): GetStatusResponse;
  clearVersionsList(): GetStatusResponse;
  addVersions(value?: DeployedComponent, index?: number): DeployedComponent;

  getFlows(): FlowStats | undefined;
  setFlows(value?: FlowStats): GetStatusResponse;
  hasFlows(): boolean;
  clearFlows(): GetStatusResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetStatusResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetStatusResponse): GetStatusResponse.AsObject;
  static serializeBinaryToWriter(message: GetStatusResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetStatusResponse;
  static deserializeBinaryFromReader(message: GetStatusResponse, reader: jspb.BinaryReader): GetStatusResponse;
}

export namespace GetStatusResponse {
  export type AsObject = {
    nodesList: Array<NodeStatus.AsObject>,
    versionsList: Array<DeployedComponent.AsObject>,
    flows?: FlowStats.AsObject,
  }
}

export class NodeStatus extends jspb.Message {
  getName(): string;
  setName(value: string): NodeStatus;

  getIsAvailable(): boolean;
  setIsAvailable(value: boolean): NodeStatus;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NodeStatus.AsObject;
  static toObject(includeInstance: boolean, msg: NodeStatus): NodeStatus.AsObject;
  static serializeBinaryToWriter(message: NodeStatus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NodeStatus;
  static deserializeBinaryFromReader(message: NodeStatus, reader: jspb.BinaryReader): NodeStatus;
}

export namespace NodeStatus {
  export type AsObject = {
    name: string,
    isAvailable: boolean,
  }
}

export class DeployedComponent extends jspb.Message {
  getName(): string;
  setName(value: string): DeployedComponent;

  getVersion(): string;
  setVersion(value: string): DeployedComponent;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeployedComponent.AsObject;
  static toObject(includeInstance: boolean, msg: DeployedComponent): DeployedComponent.AsObject;
  static serializeBinaryToWriter(message: DeployedComponent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeployedComponent;
  static deserializeBinaryFromReader(message: DeployedComponent, reader: jspb.BinaryReader): DeployedComponent;
}

export namespace DeployedComponent {
  export type AsObject = {
    name: string,
    version: string,
  }
}

export class FlowStats extends jspb.Message {
  getPerSecond(): number;
  setPerSecond(value: number): FlowStats;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FlowStats.AsObject;
  static toObject(includeInstance: boolean, msg: FlowStats): FlowStats.AsObject;
  static serializeBinaryToWriter(message: FlowStats, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FlowStats;
  static deserializeBinaryFromReader(message: FlowStats, reader: jspb.BinaryReader): FlowStats;
}

export namespace FlowStats {
  export type AsObject = {
    perSecond: number,
  }
}

