import * as jspb from "google-protobuf"

export class NodeStatusEvent extends jspb.Message {
  getStateChange(): NodeState;
  setStateChange(value: NodeState): NodeStatusEvent;

  getNodeNamesList(): Array<string>;
  setNodeNamesList(value: Array<string>): NodeStatusEvent;
  clearNodeNamesList(): NodeStatusEvent;
  addNodeNames(value: string, index?: number): NodeStatusEvent;

  getMessage(): string;
  setMessage(value: string): NodeStatusEvent;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NodeStatusEvent.AsObject;
  static toObject(includeInstance: boolean, msg: NodeStatusEvent): NodeStatusEvent.AsObject;
  static serializeBinaryToWriter(message: NodeStatusEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NodeStatusEvent;
  static deserializeBinaryFromReader(message: NodeStatusEvent, reader: jspb.BinaryReader): NodeStatusEvent;
}

export namespace NodeStatusEvent {
  export type AsObject = {
    stateChange: NodeState,
    nodeNamesList: Array<string>,
    message: string,
  }
}

export enum NodeState { 
  UNKNOWN_NODE_STATE = 0,
  NODE_CONNECTED = 1,
  NODE_UNAVAILABLE = 2,
  NODE_GONE = 3,
  NODE_ERROR = 4,
}
