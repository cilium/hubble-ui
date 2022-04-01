import _ from 'lodash';

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
} from '~/domain/hubble';

import {
  CiliumEventSubTypesCodes,
  CiliumDropReasonCodes,
} from '~/domain/cilium';
import { WrappedLayer7 } from '~/domain/layer7';
import { Labels, LabelsProps } from '~/domain/labels';
import { memoize } from '~/utils/memoize';

import * as tcpFlagsHelpers from '~/domain/helpers/tcp-flags';
import * as verdictHelpers from '~/domain/helpers/verdict';
import * as timeHelpers from '~/domain/helpers/time';
import * as protocolHelpers from '~/domain/helpers/protocol';
import * as l7helpers from '~/domain/helpers/l7';

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

  @memoize
  public get id() {
    if (this._id) return this._id;

    let timeStr = '';
    if (this.ref.time) {
      const { seconds: s, nanos: n } = this.ref.time;
      timeStr = `${Math.trunc(s)}.${Math.trunc(n)}`;
    } else {
      // WAT ?
      timeStr = `${Date.now()}`;
    }

    return `${timeStr}-${this.ref.nodeName}`;
  }

  @memoize
  public get sourceLabelProps(): LabelsProps {
    return Labels.detect(this.sourceLabels);
  }

  @memoize
  public get destinationLabelProps(): LabelsProps {
    return Labels.detect(this.destinationLabels);
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

  @memoize
  public get sourceLabels() {
    return (this.ref.source?.labelsList || []).map(l => Labels.toKV(l));
  }

  @memoize
  public get destinationLabels() {
    return (this.ref.destination?.labelsList || []).map(l => Labels.toKV(l));
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
  @memoize
  public get destinationServiceId(): string {
    if (!this.destinationLabelProps.isWorld) {
      return `${this.ref.destination?.identity}`;
    }

    if (this.destinationDns != null) {
      return `${this.destinationDns}-receiver`;
    }

    return `world-receiver`;
  }

  @memoize
  public get sourceServiceId(): string {
    if (!this.sourceLabelProps.isWorld) {
      return `${this.ref.source?.identity}`;
    }

    if (this.sourceDns != null) {
      return `${this.sourceDns}-sender`;
    }

    return `world-sender`;
  }

  @memoize
  public get sourceNamespace(): string | null {
    const sourceNs = this.ref.source?.namespace;
    if (!!sourceNs) return sourceNs;

    return Labels.findNamespaceInLabels(this.sourceLabels);
  }

  @memoize
  public get destinationNamespace(): string | null {
    const destNs = this.ref.destination?.namespace;
    if (!!destNs) return destNs;

    return Labels.findNamespaceInLabels(this.destinationLabels);
  }

  @memoize
  public get sourceIdentityName() {
    return Labels.findAppNameInLabels(this.sourceLabels);
  }

  @memoize
  public get destinationIdentityName() {
    return Labels.findAppNameInLabels(this.destinationLabels);
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
      const port = this.l7Wrapped?.http?.parsedUrl?.port;
      if (port != null) return parseInt(port);
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

  @memoize
  public get l7Wrapped(): WrappedLayer7 | null {
    if (!this.hasL7Info || this.ref.l7 == null) return null;

    return new WrappedLayer7(this.ref.l7);
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
    return CiliumDropReasonCodes[
      this.dropReasonCode as keyof typeof CiliumDropReasonCodes
    ];
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
    if (!this.ref.time) {
      return null;
    }

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

  @memoize
  public get enabledTcpFlags(): Array<keyof TCPFlags> {
    return tcpFlagsHelpers.toArray(this.tcpFlags);
  }

  @memoize
  public get joinedTcpFlags() {
    return tcpFlagsHelpers.toString(this.tcpFlags);
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

  @memoize
  public get isKubeDnsFlow() {
    return (
      this.trafficDirection === TrafficDirection.Egress &&
      this.isUdp &&
      this.destinationPort === 53 &&
      this.destinationLabelProps.isKubeDNS
    );
  }

  @memoize
  public get isFqdnFlow() {
    return (
      this.ref.destination?.labelsList.includes('reserved:world') &&
      this.destinationNamesList.length > 0
    );
  }

  @memoize
  public get isIpFlow() {
    if (this.ref.trafficDirection === TrafficDirection.Egress) {
      return !!(
        this.ref.destination?.labelsList.includes('reserved:world') &&
        this.destinationIp
      );
    } else if (this.ref.trafficDirection === TrafficDirection.Ingress) {
      return !!(
        this.ref.source?.labelsList.includes('reserved:world') && this.sourceIp
      );
    } else {
      return false;
    }
  }

  public get time() {
    return this.ref.time;
  }
}
