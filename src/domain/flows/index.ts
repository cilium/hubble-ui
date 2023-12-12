import _ from 'lodash';

import urlParse from 'url-parse';

import {
  HubbleFlow,
  Verdict,
  TrafficDirection,
  TCPFlags,
  PodSelector,
  HTTP,
  IPProtocol,
  Layer7,
  FlowType,
  L7FlowType,
  Workload,
  AuthType,
} from '~/domain/hubble';

import { CiliumEventSubTypesCodes, CiliumDropReasonCodes } from '~/domain/cilium';

import { WrappedLayer7 } from '~/domain/layer7';
import { KV, Labels, LabelsProps } from '~/domain/labels';

import * as tcpFlagsHelpers from '~/domain/helpers/tcp-flags';
import * as verdictHelpers from '~/domain/helpers/verdict';
import * as timeHelpers from '~/domain/helpers/time';
import * as protocolHelpers from '~/domain/helpers/protocol';
import * as l7helpers from '~/domain/helpers/l7';
import * as workloadHelpers from '~/domain/helpers/workload';
import * as authtypeHelpers from '~/domain/helpers/auth-type';

export { HubbleFlow, Verdict, TCPFlags };

export class Flow {
  private _id?: string;
  public ref: HubbleFlow;

  constructor(flow: HubbleFlow, flowId?: string) {
    this.ref = flow;
    this._id = flowId;
  }

  public compare(rhs: Flow): number {
    return timeHelpers.compareTimes(this.time ?? null, rhs.time ?? null);
  }

  public clone(): Flow {
    return new Flow(_.cloneDeep(this.ref));
  }

  public senderHasLabelArray(label: [string, string]): boolean {
    return !!Labels.findKVByArray(this.sourceLabels, label);
  }

  public receiverHasLabelArray(label: [string, string]): boolean {
    return !!Labels.findKVByArray(this.destinationLabels, label);
  }

  public senderHasIp(ip: string): boolean {
    return this.sourceIp === ip;
  }

  public receiverHasIp(ip: string): boolean {
    return this.destinationIp === ip;
  }

  public senderHasDomain(domain: string): boolean {
    return this.sourceNamesList.includes(domain);
  }

  public receiverHasDomain(domain: string): boolean {
    return this.destinationNamesList.includes(domain);
  }

  public hasTCPFlag(flag: keyof TCPFlags): boolean {
    return this.enabledTcpFlags.includes(flag);
  }

  public senderHasIdentity(identity: string | number): boolean {
    const num = +identity;
    if (Number.isNaN(num)) {
      console.error('flow: senderHasIdentity check with value: ', identity);
      return false;
    }

    return this.sourceIdentity === num;
  }

  public receiverHasIdentity(identity: string): boolean {
    const num = +identity;
    if (Number.isNaN(num)) {
      console.error('flow: receiverHasIdentity check with value: ', identity);
      return false;
    }

    return this.destinationIdentity === num;
  }

  public senderPodIs(podName: string): boolean {
    return this.sourcePodName === podName;
  }

  public receiverPodIs(podName: string): boolean {
    return this.destinationPodName === podName;
  }

  public senderHasWorkload(target: Workload): boolean {
    for (const wl of this.sourceWorkloads) {
      if (workloadHelpers.equals(wl, target)) return true;
    }

    return false;
  }

  public receiverHasWorkload(target: Workload): boolean {
    for (const wl of this.destinationWorkloads) {
      if (workloadHelpers.equals(wl, target)) return true;
    }

    return false;
  }

  private memoId: string | undefined;
  public get id(): string {
    if (this._id) return this._id;

    if (this.memoId !== undefined) return this.memoId;

    let timeStr = '';
    if (this.ref.time) {
      const { seconds: s, nanos: n } = this.ref.time;
      timeStr = `${Math.trunc(s)}.${Math.trunc(n)}`;
    } else {
      // WAT ?
      timeStr = `${Date.now()}`;
    }

    this.memoId = `${timeStr}-${this.ref.nodeName}`;

    return this.memoId;
  }

  private memoSourceLabelProps: LabelsProps | undefined;
  public get sourceLabelProps(): LabelsProps {
    if (this.memoSourceLabelProps !== undefined) return this.memoSourceLabelProps;

    this.memoSourceLabelProps = Labels.detect(this.sourceLabels);

    return this.memoSourceLabelProps;
  }

  private memoDestinationLabelProps: LabelsProps | undefined;
  public get destinationLabelProps(): LabelsProps {
    if (this.memoDestinationLabelProps !== undefined) return this.memoDestinationLabelProps;

    this.memoDestinationLabelProps = Labels.detect(this.destinationLabels);

    return this.memoDestinationLabelProps;
  }

  public get hubbleFlow(): HubbleFlow {
    return this.ref;
  }

  public get httpStatus(): number | undefined {
    return this.ref.l7?.http?.code;
  }

  public get hasSource() {
    return !!this.ref.source;
  }

  public get hasDestination() {
    return !!this.ref.destination;
  }

  private memoSourceLabels: KV[] | undefined;
  public get sourceLabels(): KV[] {
    if (this.memoSourceLabels !== undefined) return this.memoSourceLabels;

    this.memoSourceLabels = (this.ref.source?.labels || []).map(l => Labels.toKV(l));

    return this.memoSourceLabels;
  }

  private memoDestinationLabels: KV[] | undefined;
  public get destinationLabels(): KV[] {
    if (this.memoDestinationLabels !== undefined) return this.memoDestinationLabels;

    this.memoDestinationLabels = (this.ref.destination?.labels || []).map(l => Labels.toKV(l));

    return this.memoDestinationLabels;
  }

  public get sourceNamesList() {
    return this.ref.sourceNamesList;
  }

  public get destinationNamesList() {
    return this.ref.destinationNamesList;
  }

  public get sourceIdentity() {
    return this.ref.source?.identity ?? null;
  }

  public get destinationIdentity() {
    return this.ref.destination?.identity ?? null;
  }

  // NOTE: this function is just a copy of backend's `getServiceID` function
  private memoDestinationServiceId: string | undefined;
  public get destinationServiceId(): string {
    if (this.memoDestinationServiceId !== undefined) return this.memoDestinationServiceId;

    if (!this.destinationLabelProps.isWorld) {
      this.memoDestinationServiceId = `${this.ref.destination?.identity}`;
    } else if (this.destinationDns != null) {
      this.memoDestinationServiceId = `${this.destinationDns}-receiver`;
    } else {
      this.memoDestinationServiceId = `world-receiver`;
    }

    return this.memoDestinationServiceId;
  }

  private memoSourceServiceId: string | undefined;
  public get sourceServiceId(): string {
    if (this.memoSourceServiceId !== undefined) return this.memoSourceServiceId;

    if (!this.sourceLabelProps.isWorld) {
      this.memoSourceServiceId = `${this.ref.source?.identity}`;
    } else if (this.sourceDns != null) {
      this.memoSourceServiceId = `${this.sourceDns}-sender`;
    } else {
      this.memoSourceServiceId = `world-sender`;
    }

    return this.memoSourceServiceId;
  }

  private memoSourceNamespace: string | null | undefined;
  public get sourceNamespace(): string | null {
    if (this.memoSourceNamespace !== undefined) return this.memoSourceNamespace;

    const sourceNs = this.ref.source?.namespace;
    if (!!sourceNs) {
      this.memoSourceNamespace = sourceNs;
    } else {
      this.memoSourceNamespace = Labels.findNamespaceInLabels(this.sourceLabels);
    }

    return this.memoSourceNamespace;
  }

  private memoDestinationNamespace: string | null | undefined;
  public get destinationNamespace(): string | null {
    if (this.memoDestinationNamespace !== undefined) return this.memoDestinationNamespace;

    const destNs = this.ref.destination?.namespace;
    if (!!destNs) {
      this.memoDestinationNamespace = destNs;
    } else {
      this.memoDestinationNamespace = Labels.findNamespaceInLabels(this.destinationLabels);
    }

    return this.memoDestinationNamespace;
  }

  private memoSourceIdentityName: string | null | undefined;
  public get sourceIdentityName(): string | null {
    if (this.memoSourceIdentityName !== undefined) return this.memoSourceIdentityName;

    this.memoSourceIdentityName = Labels.findAppNameInLabels(this.sourceLabels);

    return this.memoSourceIdentityName;
  }

  private memoDestinationIdentityName: string | null | undefined;
  public get destinationIdentityName(): string | null {
    if (this.memoDestinationIdentityName !== undefined) return this.memoDestinationIdentityName;

    this.memoDestinationIdentityName = Labels.findAppNameInLabels(this.destinationLabels);

    return this.memoDestinationIdentityName;
  }

  public get sourcePodName() {
    return this.ref.source?.podName ?? null;
  }

  public get sourcePodSelector(): PodSelector {
    return {
      pod: this.sourcePodName!,
      namespace: this.ref.source?.namespace,
    };
  }

  public get destinationPodName() {
    return this.ref.destination?.podName ?? null;
  }

  public get destinationPodSelector(): PodSelector {
    return {
      pod: this.destinationPodName!,
      namespace: this.ref.destination?.namespace,
    };
  }

  public get sourceWorkloads(): Workload[] {
    return this.ref.source?.workloads || [];
  }

  public get destinationWorkloads(): Workload[] {
    return this.ref.destination?.workloads || [];
  }

  public get sourcePort(): number | null {
    if (this.ref.l4?.tcp) {
      return this.ref.l4.tcp.sourcePort;
    }

    if (this.ref.l4?.udp) {
      return this.ref.l4.udp.sourcePort;
    }

    return null;
  }

  public get destinationPort(): number | null {
    if (this.ref.l4?.tcp) {
      return this.ref.l4.tcp.destinationPort;
    }

    if (this.ref.l4?.udp) {
      return this.ref.l4.udp.destinationPort;
    }

    if (this.ref.l7?.dns != null) return 53;
    if (this.ref.l7?.http != null) {
      const parsedUrl = urlParse(this.ref.l7.http.url);
      if (parsedUrl != null && !!parsedUrl.port) {
        return parseInt(parsedUrl.port);
      }
    }

    return null;
  }

  public get protocol(): IPProtocol | null {
    if (this.ref.l4?.tcp || this.ref.l7?.kafka || this.ref.l7?.http) {
      return IPProtocol.TCP;
    }

    if (this.ref.l4?.udp || this.ref.l7?.dns) return IPProtocol.UDP;
    if (this.ref.l4?.icmpv4) return IPProtocol.ICMPv4;
    if (this.ref.l4?.icmpv6) return IPProtocol.ICMPv6;

    return null;
  }

  public get protocolStr(): string | null {
    const protocol = this.protocol;
    if (protocol == null) return null;

    return protocolHelpers.toString(protocol);
  }

  public get sourceIp() {
    return this.ref.ip?.source ?? null;
  }

  public get destinationIp() {
    return this.ref.ip?.destination ?? null;
  }

  public get http(): HTTP | null {
    return this.ref.l7?.http ?? null;
  }

  public get l7(): Layer7 | null {
    if (!this.hasL7Info) return null;

    return this.ref.l7 ?? null;
  }

  private memoL7Wrapped: WrappedLayer7 | null | undefined;
  public get l7Wrapped(): WrappedLayer7 | null {
    if (this.memoL7Wrapped !== undefined) return this.memoL7Wrapped;

    if (!this.hasL7Info || this.ref.l7 == null) {
      this.memoL7Wrapped = null;
    } else {
      this.memoL7Wrapped = new WrappedLayer7(this.ref.l7);
    }

    return this.memoL7Wrapped;
  }

  public get isL7Request(): boolean {
    return this.l7?.type === L7FlowType.Request;
  }

  public get l7Fingerprint(): string | null {
    const l7 = this.l7Wrapped;
    if (l7 == null) return null;

    const direction =
      this.l7?.type === L7FlowType.Request
        ? '->'
        : this.l7?.type === L7FlowType.Response
          ? '<-'
          : '??';

    // TODO: check if this is a correct fingerprints for all but http
    return `${direction} ${l7helpers.getEndpointId(l7)}`;
  }

  public get hasL7Info(): boolean {
    return this.type === FlowType.L7;
  }

  public get verdict(): Verdict {
    return this.ref.verdict;
  }

  public get verdictLabel(): string {
    return verdictHelpers.toString(this.ref.verdict);
  }

  public get dropReasonCode() {
    return this.ref.dropReason;
  }

  public get dropReason() {
    return CiliumDropReasonCodes[this.dropReasonCode as keyof typeof CiliumDropReasonCodes];
  }

  public get isReply() {
    return this.ref.reply;
  }

  public get ciliumEventSubTypeLabel() {
    if (!this.ref.eventType) {
      return null;
    }

    return CiliumEventSubTypesCodes[
      this.ref.eventType.subType as keyof typeof CiliumEventSubTypesCodes
    ];
  }

  public get destinationDns(): string | null {
    if (this.ref.destinationNamesList.length === 0) {
      return null;
    }

    return this.ref.destinationNamesList[0];
  }

  public get sourceDns(): string | null {
    if (this.ref.sourceNamesList.length === 0) {
      return null;
    }

    return this.ref.sourceNamesList[0];
  }

  public get millisecondsTimestamp() {
    if (!this.ref.time) return 0;

    const { seconds, nanos } = this.ref.time;
    const ms = seconds * 1000 + nanos / 1e6;

    return ms;
  }

  public get isoTimestamp() {
    if (!this.millisecondsTimestamp) {
      return null;
    }

    return new Date(this.millisecondsTimestamp).toISOString();
  }

  public get trafficDirection() {
    return this.ref.trafficDirection;
  }

  public get trafficDirectionLabel() {
    switch (this.trafficDirection) {
      case TrafficDirection.Unknown:
        return 'unknown';
      case TrafficDirection.Ingress:
        return 'ingress';
      case TrafficDirection.Egress:
        return 'egress';
    }
  }

  public get tcpFlags() {
    return this.ref.l4?.tcp?.flags ?? null;
  }

  public get isTCP(): boolean {
    return !!this.ref.l4?.tcp;
  }

  public get isUDP(): boolean {
    return !!this.ref.l4?.udp;
  }

  public get ICMPv4(): boolean {
    return !!this.ref.l4?.icmpv4;
  }

  public get ICMPv6(): boolean {
    return !!this.ref.l4?.icmpv6;
  }

  private memoEnabledTcpFlags: Array<keyof TCPFlags> | undefined;
  public get enabledTcpFlags(): Array<keyof TCPFlags> {
    if (this.memoEnabledTcpFlags !== undefined) return this.memoEnabledTcpFlags;

    this.memoEnabledTcpFlags = tcpFlagsHelpers.toArray(this.tcpFlags);

    return this.memoEnabledTcpFlags;
  }

  private memoJoinedTcpFlags: string | undefined;
  public get joinedTcpFlags(): string {
    if (this.memoJoinedTcpFlags !== undefined) return this.memoJoinedTcpFlags;

    this.memoJoinedTcpFlags = tcpFlagsHelpers.toString(this.tcpFlags);

    return this.memoJoinedTcpFlags;
  }

  public get type(): FlowType {
    return this.ref.type;
  }

  public get isTcp() {
    return !!this.ref.l4?.tcp;
  }

  public get isUdp() {
    return !!this.ref.l4?.udp;
  }

  private memoIsKubeDnsFlow: boolean | undefined;
  public get isKubeDnsFlow(): boolean {
    if (this.memoIsKubeDnsFlow !== undefined) return this.memoIsKubeDnsFlow;

    this.memoIsKubeDnsFlow =
      this.trafficDirection === TrafficDirection.Egress &&
      this.isUdp &&
      this.destinationPort === 53 &&
      this.destinationLabelProps.isKubeDNS;

    return this.memoIsKubeDnsFlow;
  }

  private memoIsFqdnFlow: boolean | undefined;
  public get isFqdnFlow() {
    if (this.memoIsFqdnFlow !== undefined) return this.memoIsFqdnFlow;

    this.memoIsFqdnFlow =
      this.ref.destination?.labels.includes('reserved:world') &&
      this.destinationNamesList.length > 0;

    return this.memoIsFqdnFlow;
  }

  private memoIsIpFlow: boolean | undefined;
  public get isIpFlow(): boolean {
    if (this.memoIsIpFlow !== undefined) return this.memoIsIpFlow;

    if (this.ref.trafficDirection === TrafficDirection.Egress) {
      this.memoIsIpFlow = !!(
        this.ref.destination?.labels.includes('reserved:world') && this.destinationIp
      );
    } else if (this.ref.trafficDirection === TrafficDirection.Ingress) {
      this.memoIsIpFlow = !!(this.ref.source?.labels.includes('reserved:world') && this.sourceIp);
    } else {
      this.memoIsIpFlow = false;
    }

    return this.memoIsIpFlow;
  }

  public get time() {
    return this.ref.time;
  }

  public get authType(): AuthType {
    return this.ref.authType;
  }

  public get isEncrypted(): boolean {
    return this.ref.ip?.encrypted ?? false;
  }

  public get authTypeLabel(): string {
    return authtypeHelpers.toString(this.ref.authType);
  }
}
