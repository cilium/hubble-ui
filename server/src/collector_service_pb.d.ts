// Copyright 2019 Authors of Hubble
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// package: io.covalent.pb
// file: collector_service.proto

import * as jspb from "google-protobuf";

export class K8sMetadata extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getNamespace(): string;
  setNamespace(value: string): void;

  getUid(): string;
  setUid(value: string): void;

  getLabelsMap(): jspb.Map<string, string>;
  clearLabelsMap(): void;
  getAnnotationsMap(): jspb.Map<string, string>;
  clearAnnotationsMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): K8sMetadata.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: K8sMetadata
  ): K8sMetadata.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: K8sMetadata,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): K8sMetadata;
  static deserializeBinaryFromReader(
    message: K8sMetadata,
    reader: jspb.BinaryReader
  ): K8sMetadata;
}

export namespace K8sMetadata {
  export type AsObject = {
    name: string;
    namespace: string;
    uid: string;
    labelsMap: Array<[string, string]>;
    annotationsMap: Array<[string, string]>;
  };
}

export class K8sPodContainerPort extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getHostPort(): number;
  setHostPort(value: number): void;

  getContainerPort(): number;
  setContainerPort(value: number): void;

  getProtocol(): string;
  setProtocol(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): K8sPodContainerPort.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: K8sPodContainerPort
  ): K8sPodContainerPort.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: K8sPodContainerPort,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): K8sPodContainerPort;
  static deserializeBinaryFromReader(
    message: K8sPodContainerPort,
    reader: jspb.BinaryReader
  ): K8sPodContainerPort;
}

export namespace K8sPodContainerPort {
  export type AsObject = {
    name: string;
    hostPort: number;
    containerPort: number;
    protocol: string;
  };
}

export class K8sPodContainer extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getImage(): string;
  setImage(value: string): void;

  clearPortsList(): void;
  getPortsList(): Array<K8sPodContainerPort>;
  setPortsList(value: Array<K8sPodContainerPort>): void;
  addPorts(value?: K8sPodContainerPort, index?: number): K8sPodContainerPort;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): K8sPodContainer.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: K8sPodContainer
  ): K8sPodContainer.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: K8sPodContainer,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): K8sPodContainer;
  static deserializeBinaryFromReader(
    message: K8sPodContainer,
    reader: jspb.BinaryReader
  ): K8sPodContainer;
}

export namespace K8sPodContainer {
  export type AsObject = {
    name: string;
    image: string;
    portsList: Array<K8sPodContainerPort.AsObject>;
  };
}

export class K8sPodSpec extends jspb.Message {
  getNodeName(): string;
  setNodeName(value: string): void;

  clearContainersList(): void;
  getContainersList(): Array<K8sPodContainer>;
  setContainersList(value: Array<K8sPodContainer>): void;
  addContainers(value?: K8sPodContainer, index?: number): K8sPodContainer;

  getHostNetwork(): boolean;
  setHostNetwork(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): K8sPodSpec.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: K8sPodSpec
  ): K8sPodSpec.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: K8sPodSpec,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): K8sPodSpec;
  static deserializeBinaryFromReader(
    message: K8sPodSpec,
    reader: jspb.BinaryReader
  ): K8sPodSpec;
}

export namespace K8sPodSpec {
  export type AsObject = {
    nodeName: string;
    containersList: Array<K8sPodContainer.AsObject>;
    hostNetwork: boolean;
  };
}

export class K8sPodStatusCondition extends jspb.Message {
  getStatus(): string;
  setStatus(value: string): void;

  getMessage(): string;
  setMessage(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): K8sPodStatusCondition.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: K8sPodStatusCondition
  ): K8sPodStatusCondition.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: K8sPodStatusCondition,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): K8sPodStatusCondition;
  static deserializeBinaryFromReader(
    message: K8sPodStatusCondition,
    reader: jspb.BinaryReader
  ): K8sPodStatusCondition;
}

export namespace K8sPodStatusCondition {
  export type AsObject = {
    status: string;
    message: string;
  };
}

export class K8sPodContainerStatus extends jspb.Message {
  getImage(): string;
  setImage(value: string): void;

  getRestartCount(): number;
  setRestartCount(value: number): void;

  getImageId(): string;
  setImageId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): K8sPodContainerStatus.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: K8sPodContainerStatus
  ): K8sPodContainerStatus.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: K8sPodContainerStatus,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): K8sPodContainerStatus;
  static deserializeBinaryFromReader(
    message: K8sPodContainerStatus,
    reader: jspb.BinaryReader
  ): K8sPodContainerStatus;
}

export namespace K8sPodContainerStatus {
  export type AsObject = {
    image: string;
    restartCount: number;
    imageId: string;
  };
}

export class K8sPodStatus extends jspb.Message {
  getPhase(): string;
  setPhase(value: string): void;

  clearConditionsList(): void;
  getConditionsList(): Array<K8sPodStatusCondition>;
  setConditionsList(value: Array<K8sPodStatusCondition>): void;
  addConditions(
    value?: K8sPodStatusCondition,
    index?: number
  ): K8sPodStatusCondition;

  getHostIp(): string;
  setHostIp(value: string): void;

  getPodIp(): string;
  setPodIp(value: string): void;

  getStartTime(): string;
  setStartTime(value: string): void;

  clearContainerStatusesList(): void;
  getContainerStatusesList(): Array<K8sPodContainerStatus>;
  setContainerStatusesList(value: Array<K8sPodContainerStatus>): void;
  addContainerStatuses(
    value?: K8sPodContainerStatus,
    index?: number
  ): K8sPodContainerStatus;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): K8sPodStatus.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: K8sPodStatus
  ): K8sPodStatus.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: K8sPodStatus,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): K8sPodStatus;
  static deserializeBinaryFromReader(
    message: K8sPodStatus,
    reader: jspb.BinaryReader
  ): K8sPodStatus;
}

export namespace K8sPodStatus {
  export type AsObject = {
    phase: string;
    conditionsList: Array<K8sPodStatusCondition.AsObject>;
    hostIp: string;
    podIp: string;
    startTime: string;
    containerStatusesList: Array<K8sPodContainerStatus.AsObject>;
  };
}

export class K8sPod extends jspb.Message {
  hasMetadata(): boolean;
  clearMetadata(): void;
  getMetadata(): K8sMetadata | undefined;
  setMetadata(value?: K8sMetadata): void;

  hasSpec(): boolean;
  clearSpec(): void;
  getSpec(): K8sPodSpec | undefined;
  setSpec(value?: K8sPodSpec): void;

  hasStatus(): boolean;
  clearStatus(): void;
  getStatus(): K8sPodStatus | undefined;
  setStatus(value?: K8sPodStatus): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): K8sPod.AsObject;
  static toObject(includeInstance: boolean, msg: K8sPod): K8sPod.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: K8sPod,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): K8sPod;
  static deserializeBinaryFromReader(
    message: K8sPod,
    reader: jspb.BinaryReader
  ): K8sPod;
}

export namespace K8sPod {
  export type AsObject = {
    metadata?: K8sMetadata.AsObject;
    spec?: K8sPodSpec.AsObject;
    status?: K8sPodStatus.AsObject;
  };
}

export class K8sPods extends jspb.Message {
  clearPodsList(): void;
  getPodsList(): Array<K8sPod>;
  setPodsList(value: Array<K8sPod>): void;
  addPods(value?: K8sPod, index?: number): K8sPod;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): K8sPods.AsObject;
  static toObject(includeInstance: boolean, msg: K8sPods): K8sPods.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: K8sPods,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): K8sPods;
  static deserializeBinaryFromReader(
    message: K8sPods,
    reader: jspb.BinaryReader
  ): K8sPods;
}

export namespace K8sPods {
  export type AsObject = {
    podsList: Array<K8sPod.AsObject>;
  };
}
