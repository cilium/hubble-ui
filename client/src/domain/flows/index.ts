import _ from 'lodash';

import { HubbleFlow, Verdict } from '~/domain/hubble';
import { Labels } from '~/domain/labels';
import { KV } from '~/domain/misc';
import { CiliumEventSubTypesCodes } from '~/domain/cilium';

export * from './flows-filter-entry';
export { HubbleFlow, Verdict };

export class Flow {
  private ref: HubbleFlow;

  private _id: string;
  private _sourceLabels: KV[];
  private _destinationLabels: KV[];

  // Cached
  private _sourceNamespace: string | null = null;
  private _destNamespace: string | null = null;

  constructor(flow: HubbleFlow) {
    this.ref = flow;

    this._sourceLabels = this.mapLabelsToKv(flow.source?.labelsList || []);
    this._destinationLabels = this.mapLabelsToKv(
      flow.destination?.labelsList || [],
    );
    this._id = this.buildId();
  }

  public clone(): Flow {
    return new Flow(_.cloneDeep(this.ref));
  }

  public get id() {
    return this._id;
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

  public get sourceLabels() {
    return this._sourceLabels;
  }

  public get destinationLabels() {
    return this._destinationLabels;
  }

  public get sourceNamesList() {
    return this.ref.sourceNamesList;
  }

  public get destinationNamesList() {
    return this.ref.destinationNamesList;
  }

  public get sourceIdentity() {
    return this.ref.source?.identity;
  }

  public get destinationIdentity() {
    return this.ref.destination?.identity;
  }

  public get sourceNamespace() {
    if (this._sourceNamespace != null) return this._sourceNamespace;

    this._sourceNamespace = Labels.findNamespaceInLabels(this.sourceLabels);
    return this._sourceNamespace;
  }

  public get destinationNamespace() {
    if (this._destNamespace != null) return this._destNamespace;

    this._destNamespace = Labels.findNamespaceInLabels(this.destinationLabels);
    return this._destNamespace;
  }

  public get sourceAppName() {
    return Labels.findAppNameInLabels(this.sourceLabels);
  }

  public get destinationAppName() {
    return Labels.findAppNameInLabels(this.destinationLabels);
  }

  public get sourcePodName() {
    if (!this.ref.source) {
      return null;
    }

    return this.ref.source.podName;
  }

  public get destinationPodName() {
    if (!this.ref.destination) {
      return null;
    }

    return this.ref.destination.podName;
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
    if (!this.ref.ip?.source) {
      return null;
    }

    return this.ref.ip.source;
  }

  public get destinationIp() {
    if (!this.ref.ip?.destination) {
      return null;
    }

    return this.ref.ip.destination;
  }

  public get verdict(): Verdict {
    return this.ref.verdict;
  }

  public get verdictLabel(): 'forwarded' | 'dropped' | 'unknown' | 'unhandled' {
    switch (this.ref.verdict) {
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

    return new Date(this.ref.time.seconds * 1000).valueOf();
  }

  public get isoTimestamp() {
    if (!this.millisecondsTimestamp) {
      return null;
    }

    return new Date(this.millisecondsTimestamp).toISOString();
  }

  private buildId() {
    let timeStr = '';
    if (this.ref.time) {
      const { seconds: s, nanos: n } = this.ref.time;
      timeStr = `${s}.${n}`;
    } else {
      // WAT ?
      timeStr = `${Date.now()}`;
    }

    return `${timeStr}-${this.ref.nodeName}`;
  }

  private mapLabelsToKv(labels: string[]) {
    return labels.map(label => {
      const [key, ...rest] = label.split('=');
      const value = rest.join('=');

      return { key, value };
    });
  }
}
