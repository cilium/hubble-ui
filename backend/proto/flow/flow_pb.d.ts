import * as jspb from "google-protobuf"

import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';

export class Flow extends jspb.Message {
  getTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTime(value?: google_protobuf_timestamp_pb.Timestamp): Flow;
  hasTime(): boolean;
  clearTime(): Flow;

  getVerdict(): Verdict;
  setVerdict(value: Verdict): Flow;

  getDropReason(): number;
  setDropReason(value: number): Flow;

  getEthernet(): Ethernet | undefined;
  setEthernet(value?: Ethernet): Flow;
  hasEthernet(): boolean;
  clearEthernet(): Flow;

  getIp(): IP | undefined;
  setIp(value?: IP): Flow;
  hasIp(): boolean;
  clearIp(): Flow;

  getL4(): Layer4 | undefined;
  setL4(value?: Layer4): Flow;
  hasL4(): boolean;
  clearL4(): Flow;

  getSource(): Endpoint | undefined;
  setSource(value?: Endpoint): Flow;
  hasSource(): boolean;
  clearSource(): Flow;

  getDestination(): Endpoint | undefined;
  setDestination(value?: Endpoint): Flow;
  hasDestination(): boolean;
  clearDestination(): Flow;

  getType(): FlowType;
  setType(value: FlowType): Flow;

  getNodeName(): string;
  setNodeName(value: string): Flow;

  getSourceNamesList(): Array<string>;
  setSourceNamesList(value: Array<string>): Flow;
  clearSourceNamesList(): Flow;
  addSourceNames(value: string, index?: number): Flow;

  getDestinationNamesList(): Array<string>;
  setDestinationNamesList(value: Array<string>): Flow;
  clearDestinationNamesList(): Flow;
  addDestinationNames(value: string, index?: number): Flow;

  getL7(): Layer7 | undefined;
  setL7(value?: Layer7): Flow;
  hasL7(): boolean;
  clearL7(): Flow;

  getReply(): boolean;
  setReply(value: boolean): Flow;

  getEventType(): CiliumEventType | undefined;
  setEventType(value?: CiliumEventType): Flow;
  hasEventType(): boolean;
  clearEventType(): Flow;

  getSourceService(): Service | undefined;
  setSourceService(value?: Service): Flow;
  hasSourceService(): boolean;
  clearSourceService(): Flow;

  getDestinationService(): Service | undefined;
  setDestinationService(value?: Service): Flow;
  hasDestinationService(): boolean;
  clearDestinationService(): Flow;

  getTrafficDirection(): TrafficDirection;
  setTrafficDirection(value: TrafficDirection): Flow;

  getPolicyMatchType(): number;
  setPolicyMatchType(value: number): Flow;

  getTraceObservationPoint(): TraceObservationPoint;
  setTraceObservationPoint(value: TraceObservationPoint): Flow;

  getDropReasonDesc(): DropReason;
  setDropReasonDesc(value: DropReason): Flow;

  getIsReply(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setIsReply(value?: google_protobuf_wrappers_pb.BoolValue): Flow;
  hasIsReply(): boolean;
  clearIsReply(): Flow;

  getSummary(): string;
  setSummary(value: string): Flow;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Flow.AsObject;
  static toObject(includeInstance: boolean, msg: Flow): Flow.AsObject;
  static serializeBinaryToWriter(message: Flow, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Flow;
  static deserializeBinaryFromReader(message: Flow, reader: jspb.BinaryReader): Flow;
}

export namespace Flow {
  export type AsObject = {
    time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    verdict: Verdict,
    dropReason: number,
    ethernet?: Ethernet.AsObject,
    ip?: IP.AsObject,
    l4?: Layer4.AsObject,
    source?: Endpoint.AsObject,
    destination?: Endpoint.AsObject,
    type: FlowType,
    nodeName: string,
    sourceNamesList: Array<string>,
    destinationNamesList: Array<string>,
    l7?: Layer7.AsObject,
    reply: boolean,
    eventType?: CiliumEventType.AsObject,
    sourceService?: Service.AsObject,
    destinationService?: Service.AsObject,
    trafficDirection: TrafficDirection,
    policyMatchType: number,
    traceObservationPoint: TraceObservationPoint,
    dropReasonDesc: DropReason,
    isReply?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    summary: string,
  }
}

export class Layer4 extends jspb.Message {
  getTcp(): TCP | undefined;
  setTcp(value?: TCP): Layer4;
  hasTcp(): boolean;
  clearTcp(): Layer4;

  getUdp(): UDP | undefined;
  setUdp(value?: UDP): Layer4;
  hasUdp(): boolean;
  clearUdp(): Layer4;

  getIcmpv4(): ICMPv4 | undefined;
  setIcmpv4(value?: ICMPv4): Layer4;
  hasIcmpv4(): boolean;
  clearIcmpv4(): Layer4;

  getIcmpv6(): ICMPv6 | undefined;
  setIcmpv6(value?: ICMPv6): Layer4;
  hasIcmpv6(): boolean;
  clearIcmpv6(): Layer4;

  getProtocolCase(): Layer4.ProtocolCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Layer4.AsObject;
  static toObject(includeInstance: boolean, msg: Layer4): Layer4.AsObject;
  static serializeBinaryToWriter(message: Layer4, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Layer4;
  static deserializeBinaryFromReader(message: Layer4, reader: jspb.BinaryReader): Layer4;
}

export namespace Layer4 {
  export type AsObject = {
    tcp?: TCP.AsObject,
    udp?: UDP.AsObject,
    icmpv4?: ICMPv4.AsObject,
    icmpv6?: ICMPv6.AsObject,
  }

  export enum ProtocolCase { 
    PROTOCOL_NOT_SET = 0,
    TCP = 1,
    UDP = 2,
    ICMPV4 = 3,
    ICMPV6 = 4,
  }
}

export class Layer7 extends jspb.Message {
  getType(): L7FlowType;
  setType(value: L7FlowType): Layer7;

  getLatencyNs(): number;
  setLatencyNs(value: number): Layer7;

  getDns(): DNS | undefined;
  setDns(value?: DNS): Layer7;
  hasDns(): boolean;
  clearDns(): Layer7;

  getHttp(): HTTP | undefined;
  setHttp(value?: HTTP): Layer7;
  hasHttp(): boolean;
  clearHttp(): Layer7;

  getKafka(): Kafka | undefined;
  setKafka(value?: Kafka): Layer7;
  hasKafka(): boolean;
  clearKafka(): Layer7;

  getRecordCase(): Layer7.RecordCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Layer7.AsObject;
  static toObject(includeInstance: boolean, msg: Layer7): Layer7.AsObject;
  static serializeBinaryToWriter(message: Layer7, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Layer7;
  static deserializeBinaryFromReader(message: Layer7, reader: jspb.BinaryReader): Layer7;
}

export namespace Layer7 {
  export type AsObject = {
    type: L7FlowType,
    latencyNs: number,
    dns?: DNS.AsObject,
    http?: HTTP.AsObject,
    kafka?: Kafka.AsObject,
  }

  export enum RecordCase { 
    RECORD_NOT_SET = 0,
    DNS = 100,
    HTTP = 101,
    KAFKA = 102,
  }
}

export class Endpoint extends jspb.Message {
  getId(): number;
  setId(value: number): Endpoint;

  getIdentity(): number;
  setIdentity(value: number): Endpoint;

  getNamespace(): string;
  setNamespace(value: string): Endpoint;

  getLabelsList(): Array<string>;
  setLabelsList(value: Array<string>): Endpoint;
  clearLabelsList(): Endpoint;
  addLabels(value: string, index?: number): Endpoint;

  getPodName(): string;
  setPodName(value: string): Endpoint;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Endpoint.AsObject;
  static toObject(includeInstance: boolean, msg: Endpoint): Endpoint.AsObject;
  static serializeBinaryToWriter(message: Endpoint, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Endpoint;
  static deserializeBinaryFromReader(message: Endpoint, reader: jspb.BinaryReader): Endpoint;
}

export namespace Endpoint {
  export type AsObject = {
    id: number,
    identity: number,
    namespace: string,
    labelsList: Array<string>,
    podName: string,
  }
}

export class TCP extends jspb.Message {
  getSourcePort(): number;
  setSourcePort(value: number): TCP;

  getDestinationPort(): number;
  setDestinationPort(value: number): TCP;

  getFlags(): TCPFlags | undefined;
  setFlags(value?: TCPFlags): TCP;
  hasFlags(): boolean;
  clearFlags(): TCP;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TCP.AsObject;
  static toObject(includeInstance: boolean, msg: TCP): TCP.AsObject;
  static serializeBinaryToWriter(message: TCP, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TCP;
  static deserializeBinaryFromReader(message: TCP, reader: jspb.BinaryReader): TCP;
}

export namespace TCP {
  export type AsObject = {
    sourcePort: number,
    destinationPort: number,
    flags?: TCPFlags.AsObject,
  }
}

export class IP extends jspb.Message {
  getSource(): string;
  setSource(value: string): IP;

  getDestination(): string;
  setDestination(value: string): IP;

  getIpversion(): IPVersion;
  setIpversion(value: IPVersion): IP;

  getEncrypted(): boolean;
  setEncrypted(value: boolean): IP;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): IP.AsObject;
  static toObject(includeInstance: boolean, msg: IP): IP.AsObject;
  static serializeBinaryToWriter(message: IP, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): IP;
  static deserializeBinaryFromReader(message: IP, reader: jspb.BinaryReader): IP;
}

export namespace IP {
  export type AsObject = {
    source: string,
    destination: string,
    ipversion: IPVersion,
    encrypted: boolean,
  }
}

export class Ethernet extends jspb.Message {
  getSource(): string;
  setSource(value: string): Ethernet;

  getDestination(): string;
  setDestination(value: string): Ethernet;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Ethernet.AsObject;
  static toObject(includeInstance: boolean, msg: Ethernet): Ethernet.AsObject;
  static serializeBinaryToWriter(message: Ethernet, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Ethernet;
  static deserializeBinaryFromReader(message: Ethernet, reader: jspb.BinaryReader): Ethernet;
}

export namespace Ethernet {
  export type AsObject = {
    source: string,
    destination: string,
  }
}

export class TCPFlags extends jspb.Message {
  getFin(): boolean;
  setFin(value: boolean): TCPFlags;

  getSyn(): boolean;
  setSyn(value: boolean): TCPFlags;

  getRst(): boolean;
  setRst(value: boolean): TCPFlags;

  getPsh(): boolean;
  setPsh(value: boolean): TCPFlags;

  getAck(): boolean;
  setAck(value: boolean): TCPFlags;

  getUrg(): boolean;
  setUrg(value: boolean): TCPFlags;

  getEce(): boolean;
  setEce(value: boolean): TCPFlags;

  getCwr(): boolean;
  setCwr(value: boolean): TCPFlags;

  getNs(): boolean;
  setNs(value: boolean): TCPFlags;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TCPFlags.AsObject;
  static toObject(includeInstance: boolean, msg: TCPFlags): TCPFlags.AsObject;
  static serializeBinaryToWriter(message: TCPFlags, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TCPFlags;
  static deserializeBinaryFromReader(message: TCPFlags, reader: jspb.BinaryReader): TCPFlags;
}

export namespace TCPFlags {
  export type AsObject = {
    fin: boolean,
    syn: boolean,
    rst: boolean,
    psh: boolean,
    ack: boolean,
    urg: boolean,
    ece: boolean,
    cwr: boolean,
    ns: boolean,
  }
}

export class UDP extends jspb.Message {
  getSourcePort(): number;
  setSourcePort(value: number): UDP;

  getDestinationPort(): number;
  setDestinationPort(value: number): UDP;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UDP.AsObject;
  static toObject(includeInstance: boolean, msg: UDP): UDP.AsObject;
  static serializeBinaryToWriter(message: UDP, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UDP;
  static deserializeBinaryFromReader(message: UDP, reader: jspb.BinaryReader): UDP;
}

export namespace UDP {
  export type AsObject = {
    sourcePort: number,
    destinationPort: number,
  }
}

export class ICMPv4 extends jspb.Message {
  getType(): number;
  setType(value: number): ICMPv4;

  getCode(): number;
  setCode(value: number): ICMPv4;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ICMPv4.AsObject;
  static toObject(includeInstance: boolean, msg: ICMPv4): ICMPv4.AsObject;
  static serializeBinaryToWriter(message: ICMPv4, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ICMPv4;
  static deserializeBinaryFromReader(message: ICMPv4, reader: jspb.BinaryReader): ICMPv4;
}

export namespace ICMPv4 {
  export type AsObject = {
    type: number,
    code: number,
  }
}

export class ICMPv6 extends jspb.Message {
  getType(): number;
  setType(value: number): ICMPv6;

  getCode(): number;
  setCode(value: number): ICMPv6;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ICMPv6.AsObject;
  static toObject(includeInstance: boolean, msg: ICMPv6): ICMPv6.AsObject;
  static serializeBinaryToWriter(message: ICMPv6, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ICMPv6;
  static deserializeBinaryFromReader(message: ICMPv6, reader: jspb.BinaryReader): ICMPv6;
}

export namespace ICMPv6 {
  export type AsObject = {
    type: number,
    code: number,
  }
}

export class EventTypeFilter extends jspb.Message {
  getType(): number;
  setType(value: number): EventTypeFilter;

  getMatchSubType(): boolean;
  setMatchSubType(value: boolean): EventTypeFilter;

  getSubType(): number;
  setSubType(value: number): EventTypeFilter;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EventTypeFilter.AsObject;
  static toObject(includeInstance: boolean, msg: EventTypeFilter): EventTypeFilter.AsObject;
  static serializeBinaryToWriter(message: EventTypeFilter, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EventTypeFilter;
  static deserializeBinaryFromReader(message: EventTypeFilter, reader: jspb.BinaryReader): EventTypeFilter;
}

export namespace EventTypeFilter {
  export type AsObject = {
    type: number,
    matchSubType: boolean,
    subType: number,
  }
}

export class CiliumEventType extends jspb.Message {
  getType(): number;
  setType(value: number): CiliumEventType;

  getSubType(): number;
  setSubType(value: number): CiliumEventType;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CiliumEventType.AsObject;
  static toObject(includeInstance: boolean, msg: CiliumEventType): CiliumEventType.AsObject;
  static serializeBinaryToWriter(message: CiliumEventType, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CiliumEventType;
  static deserializeBinaryFromReader(message: CiliumEventType, reader: jspb.BinaryReader): CiliumEventType;
}

export namespace CiliumEventType {
  export type AsObject = {
    type: number,
    subType: number,
  }
}

export class FlowFilter extends jspb.Message {
  getSourceIpList(): Array<string>;
  setSourceIpList(value: Array<string>): FlowFilter;
  clearSourceIpList(): FlowFilter;
  addSourceIp(value: string, index?: number): FlowFilter;

  getSourcePodList(): Array<string>;
  setSourcePodList(value: Array<string>): FlowFilter;
  clearSourcePodList(): FlowFilter;
  addSourcePod(value: string, index?: number): FlowFilter;

  getSourceFqdnList(): Array<string>;
  setSourceFqdnList(value: Array<string>): FlowFilter;
  clearSourceFqdnList(): FlowFilter;
  addSourceFqdn(value: string, index?: number): FlowFilter;

  getSourceLabelList(): Array<string>;
  setSourceLabelList(value: Array<string>): FlowFilter;
  clearSourceLabelList(): FlowFilter;
  addSourceLabel(value: string, index?: number): FlowFilter;

  getSourceServiceList(): Array<string>;
  setSourceServiceList(value: Array<string>): FlowFilter;
  clearSourceServiceList(): FlowFilter;
  addSourceService(value: string, index?: number): FlowFilter;

  getDestinationIpList(): Array<string>;
  setDestinationIpList(value: Array<string>): FlowFilter;
  clearDestinationIpList(): FlowFilter;
  addDestinationIp(value: string, index?: number): FlowFilter;

  getDestinationPodList(): Array<string>;
  setDestinationPodList(value: Array<string>): FlowFilter;
  clearDestinationPodList(): FlowFilter;
  addDestinationPod(value: string, index?: number): FlowFilter;

  getDestinationFqdnList(): Array<string>;
  setDestinationFqdnList(value: Array<string>): FlowFilter;
  clearDestinationFqdnList(): FlowFilter;
  addDestinationFqdn(value: string, index?: number): FlowFilter;

  getDestinationLabelList(): Array<string>;
  setDestinationLabelList(value: Array<string>): FlowFilter;
  clearDestinationLabelList(): FlowFilter;
  addDestinationLabel(value: string, index?: number): FlowFilter;

  getDestinationServiceList(): Array<string>;
  setDestinationServiceList(value: Array<string>): FlowFilter;
  clearDestinationServiceList(): FlowFilter;
  addDestinationService(value: string, index?: number): FlowFilter;

  getVerdictList(): Array<Verdict>;
  setVerdictList(value: Array<Verdict>): FlowFilter;
  clearVerdictList(): FlowFilter;
  addVerdict(value: Verdict, index?: number): FlowFilter;

  getEventTypeList(): Array<EventTypeFilter>;
  setEventTypeList(value: Array<EventTypeFilter>): FlowFilter;
  clearEventTypeList(): FlowFilter;
  addEventType(value?: EventTypeFilter, index?: number): EventTypeFilter;

  getHttpStatusCodeList(): Array<string>;
  setHttpStatusCodeList(value: Array<string>): FlowFilter;
  clearHttpStatusCodeList(): FlowFilter;
  addHttpStatusCode(value: string, index?: number): FlowFilter;

  getProtocolList(): Array<string>;
  setProtocolList(value: Array<string>): FlowFilter;
  clearProtocolList(): FlowFilter;
  addProtocol(value: string, index?: number): FlowFilter;

  getSourcePortList(): Array<string>;
  setSourcePortList(value: Array<string>): FlowFilter;
  clearSourcePortList(): FlowFilter;
  addSourcePort(value: string, index?: number): FlowFilter;

  getDestinationPortList(): Array<string>;
  setDestinationPortList(value: Array<string>): FlowFilter;
  clearDestinationPortList(): FlowFilter;
  addDestinationPort(value: string, index?: number): FlowFilter;

  getReplyList(): Array<boolean>;
  setReplyList(value: Array<boolean>): FlowFilter;
  clearReplyList(): FlowFilter;
  addReply(value: boolean, index?: number): FlowFilter;

  getDnsQueryList(): Array<string>;
  setDnsQueryList(value: Array<string>): FlowFilter;
  clearDnsQueryList(): FlowFilter;
  addDnsQuery(value: string, index?: number): FlowFilter;

  getSourceIdentityList(): Array<number>;
  setSourceIdentityList(value: Array<number>): FlowFilter;
  clearSourceIdentityList(): FlowFilter;
  addSourceIdentity(value: number, index?: number): FlowFilter;

  getDestinationIdentityList(): Array<number>;
  setDestinationIdentityList(value: Array<number>): FlowFilter;
  clearDestinationIdentityList(): FlowFilter;
  addDestinationIdentity(value: number, index?: number): FlowFilter;

  getHttpMethodList(): Array<string>;
  setHttpMethodList(value: Array<string>): FlowFilter;
  clearHttpMethodList(): FlowFilter;
  addHttpMethod(value: string, index?: number): FlowFilter;

  getHttpPathList(): Array<string>;
  setHttpPathList(value: Array<string>): FlowFilter;
  clearHttpPathList(): FlowFilter;
  addHttpPath(value: string, index?: number): FlowFilter;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FlowFilter.AsObject;
  static toObject(includeInstance: boolean, msg: FlowFilter): FlowFilter.AsObject;
  static serializeBinaryToWriter(message: FlowFilter, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FlowFilter;
  static deserializeBinaryFromReader(message: FlowFilter, reader: jspb.BinaryReader): FlowFilter;
}

export namespace FlowFilter {
  export type AsObject = {
    sourceIpList: Array<string>,
    sourcePodList: Array<string>,
    sourceFqdnList: Array<string>,
    sourceLabelList: Array<string>,
    sourceServiceList: Array<string>,
    destinationIpList: Array<string>,
    destinationPodList: Array<string>,
    destinationFqdnList: Array<string>,
    destinationLabelList: Array<string>,
    destinationServiceList: Array<string>,
    verdictList: Array<Verdict>,
    eventTypeList: Array<EventTypeFilter.AsObject>,
    httpStatusCodeList: Array<string>,
    protocolList: Array<string>,
    sourcePortList: Array<string>,
    destinationPortList: Array<string>,
    replyList: Array<boolean>,
    dnsQueryList: Array<string>,
    sourceIdentityList: Array<number>,
    destinationIdentityList: Array<number>,
    httpMethodList: Array<string>,
    httpPathList: Array<string>,
  }
}

export class DNS extends jspb.Message {
  getQuery(): string;
  setQuery(value: string): DNS;

  getIpsList(): Array<string>;
  setIpsList(value: Array<string>): DNS;
  clearIpsList(): DNS;
  addIps(value: string, index?: number): DNS;

  getTtl(): number;
  setTtl(value: number): DNS;

  getCnamesList(): Array<string>;
  setCnamesList(value: Array<string>): DNS;
  clearCnamesList(): DNS;
  addCnames(value: string, index?: number): DNS;

  getObservationSource(): string;
  setObservationSource(value: string): DNS;

  getRcode(): number;
  setRcode(value: number): DNS;

  getQtypesList(): Array<string>;
  setQtypesList(value: Array<string>): DNS;
  clearQtypesList(): DNS;
  addQtypes(value: string, index?: number): DNS;

  getRrtypesList(): Array<string>;
  setRrtypesList(value: Array<string>): DNS;
  clearRrtypesList(): DNS;
  addRrtypes(value: string, index?: number): DNS;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DNS.AsObject;
  static toObject(includeInstance: boolean, msg: DNS): DNS.AsObject;
  static serializeBinaryToWriter(message: DNS, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DNS;
  static deserializeBinaryFromReader(message: DNS, reader: jspb.BinaryReader): DNS;
}

export namespace DNS {
  export type AsObject = {
    query: string,
    ipsList: Array<string>,
    ttl: number,
    cnamesList: Array<string>,
    observationSource: string,
    rcode: number,
    qtypesList: Array<string>,
    rrtypesList: Array<string>,
  }
}

export class HTTPHeader extends jspb.Message {
  getKey(): string;
  setKey(value: string): HTTPHeader;

  getValue(): string;
  setValue(value: string): HTTPHeader;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HTTPHeader.AsObject;
  static toObject(includeInstance: boolean, msg: HTTPHeader): HTTPHeader.AsObject;
  static serializeBinaryToWriter(message: HTTPHeader, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HTTPHeader;
  static deserializeBinaryFromReader(message: HTTPHeader, reader: jspb.BinaryReader): HTTPHeader;
}

export namespace HTTPHeader {
  export type AsObject = {
    key: string,
    value: string,
  }
}

export class HTTP extends jspb.Message {
  getCode(): number;
  setCode(value: number): HTTP;

  getMethod(): string;
  setMethod(value: string): HTTP;

  getUrl(): string;
  setUrl(value: string): HTTP;

  getProtocol(): string;
  setProtocol(value: string): HTTP;

  getHeadersList(): Array<HTTPHeader>;
  setHeadersList(value: Array<HTTPHeader>): HTTP;
  clearHeadersList(): HTTP;
  addHeaders(value?: HTTPHeader, index?: number): HTTPHeader;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HTTP.AsObject;
  static toObject(includeInstance: boolean, msg: HTTP): HTTP.AsObject;
  static serializeBinaryToWriter(message: HTTP, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HTTP;
  static deserializeBinaryFromReader(message: HTTP, reader: jspb.BinaryReader): HTTP;
}

export namespace HTTP {
  export type AsObject = {
    code: number,
    method: string,
    url: string,
    protocol: string,
    headersList: Array<HTTPHeader.AsObject>,
  }
}

export class Kafka extends jspb.Message {
  getErrorCode(): number;
  setErrorCode(value: number): Kafka;

  getApiVersion(): number;
  setApiVersion(value: number): Kafka;

  getApiKey(): string;
  setApiKey(value: string): Kafka;

  getCorrelationId(): number;
  setCorrelationId(value: number): Kafka;

  getTopic(): string;
  setTopic(value: string): Kafka;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Kafka.AsObject;
  static toObject(includeInstance: boolean, msg: Kafka): Kafka.AsObject;
  static serializeBinaryToWriter(message: Kafka, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Kafka;
  static deserializeBinaryFromReader(message: Kafka, reader: jspb.BinaryReader): Kafka;
}

export namespace Kafka {
  export type AsObject = {
    errorCode: number,
    apiVersion: number,
    apiKey: string,
    correlationId: number,
    topic: string,
  }
}

export class Service extends jspb.Message {
  getName(): string;
  setName(value: string): Service;

  getNamespace(): string;
  setNamespace(value: string): Service;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Service.AsObject;
  static toObject(includeInstance: boolean, msg: Service): Service.AsObject;
  static serializeBinaryToWriter(message: Service, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Service;
  static deserializeBinaryFromReader(message: Service, reader: jspb.BinaryReader): Service;
}

export namespace Service {
  export type AsObject = {
    name: string,
    namespace: string,
  }
}

export class LostEvent extends jspb.Message {
  getSource(): LostEventSource;
  setSource(value: LostEventSource): LostEvent;

  getNumEventsLost(): number;
  setNumEventsLost(value: number): LostEvent;

  getCpu(): google_protobuf_wrappers_pb.Int32Value | undefined;
  setCpu(value?: google_protobuf_wrappers_pb.Int32Value): LostEvent;
  hasCpu(): boolean;
  clearCpu(): LostEvent;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LostEvent.AsObject;
  static toObject(includeInstance: boolean, msg: LostEvent): LostEvent.AsObject;
  static serializeBinaryToWriter(message: LostEvent, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LostEvent;
  static deserializeBinaryFromReader(message: LostEvent, reader: jspb.BinaryReader): LostEvent;
}

export namespace LostEvent {
  export type AsObject = {
    source: LostEventSource,
    numEventsLost: number,
    cpu?: google_protobuf_wrappers_pb.Int32Value.AsObject,
  }
}

export enum FlowType { 
  UNKNOWN_TYPE = 0,
  L3_L4 = 1,
  L7 = 2,
}
export enum TraceObservationPoint { 
  UNKNOWN_POINT = 0,
  TO_PROXY = 1,
  TO_HOST = 2,
  TO_STACK = 3,
  TO_OVERLAY = 4,
  TO_ENDPOINT = 101,
  FROM_ENDPOINT = 5,
  FROM_PROXY = 6,
  FROM_HOST = 7,
  FROM_STACK = 8,
  FROM_OVERLAY = 9,
  FROM_NETWORK = 10,
  TO_NETWORK = 11,
}
export enum L7FlowType { 
  UNKNOWN_L7_TYPE = 0,
  REQUEST = 1,
  RESPONSE = 2,
  SAMPLE = 3,
}
export enum IPVersion { 
  IP_NOT_USED = 0,
  IPV4 = 1,
  IPV6 = 2,
}
export enum Verdict { 
  VERDICT_UNKNOWN = 0,
  FORWARDED = 1,
  DROPPED = 2,
  ERROR = 3,
}
export enum DropReason { 
  DROP_REASON_UNKNOWN = 0,
  INVALID_SOURCE_MAC = 130,
  INVALID_DESTINATION_MAC = 131,
  INVALID_SOURCE_IP = 132,
  POLICY_DENIED = 133,
  INVALID_PACKET_DROPPED = 134,
  CT_TRUNCATED_OR_INVALID_HEADER = 135,
  CT_MISSING_TCP_ACK_FLAG = 136,
  CT_UNKNOWN_L4_PROTOCOL = 137,
  CT_CANNOT_CREATE_ENTRY_FROM_PACKET = 138,
  UNSUPPORTED_L3_PROTOCOL = 139,
  MISSED_TAIL_CALL = 140,
  ERROR_WRITING_TO_PACKET = 141,
  UNKNOWN_L4_PROTOCOL = 142,
  UNKNOWN_ICMPV4_CODE = 143,
  UNKNOWN_ICMPV4_TYPE = 144,
  UNKNOWN_ICMPV6_CODE = 145,
  UNKNOWN_ICMPV6_TYPE = 146,
  ERROR_RETRIEVING_TUNNEL_KEY = 147,
  ERROR_RETRIEVING_TUNNEL_OPTIONS = 148,
  INVALID_GENEVE_OPTION = 149,
  UNKNOWN_L3_TARGET_ADDRESS = 150,
  STALE_OR_UNROUTABLE_IP = 151,
  NO_MATCHING_LOCAL_CONTAINER_FOUND = 152,
  ERROR_WHILE_CORRECTING_L3_CHECKSUM = 153,
  ERROR_WHILE_CORRECTING_L4_CHECKSUM = 154,
  CT_MAP_INSERTION_FAILED = 155,
  INVALID_IPV6_EXTENSION_HEADER = 156,
  IP_FRAGMENTATION_NOT_SUPPORTED = 157,
  SERVICE_BACKEND_NOT_FOUND = 158,
  NO_TUNNEL_OR_ENCAPSULATION_ENDPOINT = 160,
  FAILED_TO_INSERT_INTO_PROXYMAP = 161,
  REACHED_EDT_RATE_LIMITING_DROP_HORIZON = 162,
  UNKNOWN_CONNECTION_TRACKING_STATE = 163,
  LOCAL_HOST_IS_UNREACHABLE = 164,
  NO_CONFIGURATION_AVAILABLE_TO_PERFORM_POLICY_DECISION = 165,
  UNSUPPORTED_L2_PROTOCOL = 166,
  NO_MAPPING_FOR_NAT_MASQUERADE = 167,
  UNSUPPORTED_PROTOCOL_FOR_NAT_MASQUERADE = 168,
  FIB_LOOKUP_FAILED = 169,
  ENCAPSULATION_TRAFFIC_IS_PROHIBITED = 170,
  INVALID_IDENTITY = 171,
  UNKNOWN_SENDER = 172,
  NAT_NOT_NEEDED = 173,
  IS_A_CLUSTERIP = 174,
  FIRST_LOGICAL_DATAGRAM_FRAGMENT_NOT_FOUND = 175,
  FORBIDDEN_ICMPV6_MESSAGE = 176,
  DENIED_BY_LB_SRC_RANGE_CHECK = 177,
  SOCKET_LOOKUP_FAILED = 178,
  SOCKET_ASSIGN_FAILED = 179,
  PROXY_REDIRECTION_NOT_SUPPORTED_FOR_PROTOCOL = 180,
}
export enum TrafficDirection { 
  TRAFFIC_DIRECTION_UNKNOWN = 0,
  INGRESS = 1,
  EGRESS = 2,
}
export enum EventType { 
  UNKNOWN = 0,
  EVENTSAMPLE = 9,
  RECORDLOST = 2,
}
export enum LostEventSource { 
  UNKNOWN_LOST_EVENT_SOURCE = 0,
  PERF_EVENT_RING_BUFFER = 1,
  OBSERVER_EVENTS_QUEUE = 2,
}
