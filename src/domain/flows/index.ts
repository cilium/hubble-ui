import _ from 'lodash';

import {
  HubbleFlow,
  Verdict,
  TrafficDirection,
  TCPFlags,
} from '~/domain/hubble';
import { Labels, LabelsProps } from '~/domain/labels';
import {
  CiliumEventSubTypesCodes,
  CiliumDropReasonCodes,
} from '~/domain/cilium';
import { KV } from '~/domain/misc';
import { memoize } from '~/utils/memoize';

export * from './flows-filter-entry';
export { HubbleFlow, Verdict };

export class Flow {
  private ref: HubbleFlow;

  constructor(flow: HubbleFlow) {
    this.ref = flow;
  }

  public clone(): Flow {
    return new Flow(_.cloneDeep(this.ref));
  }

  @memoize
  public get id() {
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
    return Boolean(this.ref.source);
  }

  public get hasDestination() {
    return Boolean(this.ref.destination);
  }

  @memoize
  public get sourceLabels() {
    return this.mapLabelsToKv(this.ref.source?.labelsList || []);
  }

  @memoize
  public get destinationLabels() {
    return this.mapLabelsToKv(this.ref.destination?.labelsList || []);
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

  @memoize
  public get sourceNamespace() {
    return Labels.findNamespaceInLabels(this.sourceLabels);
  }

  @memoize
  public get destinationNamespace() {
    return Labels.findNamespaceInLabels(this.destinationLabels);
  }

  @memoize
  public get sourceAppName() {
    return Labels.findAppNameInLabels(this.sourceLabels);
  }

  @memoize
  public get destinationAppName() {
    return Labels.findAppNameInLabels(this.destinationLabels);
  }

  public get sourcePodName() {
    return this.ref.source?.podName ?? null;
  }

  public get destinationPodName() {
    return this.ref.destination?.podName ?? null;
  }

  public get destinationPort() {
    if (this.ref.l4?.tcp) {
      return this.ref.l4.tcp.destinationPort;
    }

    if (this.ref.l4?.udp) {
      return this.ref.l4.udp.destinationPort;
    }

    return null;
  }

  public get sourceIp() {
    return this.ref.ip?.source ?? null;
  }

  public get destinationIp() {
    return this.ref.ip?.destination ?? null;
  }

  public get verdict(): Verdict {
    return this.ref.verdict;
  }

  public get verdictLabel(): 'forwarded' | 'dropped' | 'unknown' | 'unhandled' {
    return Flow.getVerdictLabel(this.ref.verdict);
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

  public get destinationDns() {
    if (this.ref.destinationNamesList.length === 0) {
      return null;
    }

    return this.ref.destinationNamesList[0];
  }

  public get millisecondsTimestamp() {
    if (!this.ref.time) {
      return null;
    }

    const { seconds, nanos } = this.ref.time;
    const ms = seconds * 1000 + nanos / 1e6;

    return new Date(ms).valueOf();
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

  @memoize
  public get enabledTcpFlags(): Array<keyof TCPFlags> {
    if (this.tcpFlags == null) return [];

    return Object.keys(this.tcpFlags)
      .filter(f => {
        const flag = f as keyof TCPFlags;
        return this.tcpFlags?.[flag];
      })
      .sort() as Array<keyof TCPFlags>;
  }

  @memoize
  public get joinedTcpFlags() {
    if (this.enabledTcpFlags.length === 0) return null;

    return this.enabledTcpFlags.map(f => f.toLocaleUpperCase()).join(' ');
  }

  public static getVerdictLabel(
    verdict: Verdict,
  ): 'forwarded' | 'dropped' | 'unknown' | 'unhandled' {
    switch (verdict) {
      case Verdict.Forwarded:
        return 'forwarded';
      case Verdict.Dropped:
        return 'dropped';
      case Verdict.Unknown:
        return 'unknown';
      default:
        return 'unhandled';
    }
  }

  private mapLabelsToKv(labels: string[]) {
    return labels.map(label => {
      const [key, ...rest] = label.split('=');
      const value = rest.join('=');

      return { key, value };
    });
  }
}
