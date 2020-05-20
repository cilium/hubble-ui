import hash from 'object-hash';

import { HubbleFlow, Verdict } from '~/domain/hubble';
import { Labels } from '~/domain/labels';
import { KV } from '~/domain/misc';
import { CiliumEventSubTypesCodes } from '~/domain/cilium';

export * from './filter-utils';
export { HubbleFlow };

export class Flow {
  private ref: HubbleFlow;

  private _id: string;
  private _sourceLabels: KV[];
  private _destinationLabels: KV[];

  constructor(flow: HubbleFlow) {
    this.ref = flow;

    this._id = this.buildId();
    this._sourceLabels = this.mapLabelsToKv(flow.source?.labelsList || []);
    this._destinationLabels = this.mapLabelsToKv(
      flow.destination?.labelsList || [],
    );
  }

  public get id() {
    return this._id;
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

  public get sourceNamespace() {
    return Labels.findNamespaceInLabels(this.sourceLabels);
  }

  public get destinationNamespace() {
    return Labels.findNamespaceInLabels(this.destinationLabels);
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

  public get verdictLabel(): string {
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

  public get direction() {
    return this.isReply ? 'response' : 'request';
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
    if (!this.ref.destination || !this.ref.l7?.dns) {
      return null;
    }
    return this.ref.l7.dns;
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
    return hash([
      [...(this.ref.source?.labelsList || [])].sort(),
      [...(this.ref.destination?.labelsList || [])].sort(),
      this.ref.l4?.tcp?.destinationPort,
      this.ref.verdict,
      this.ref.time,
    ]);
  }

  private mapLabelsToKv(labels: string[]) {
    return labels.map(label => {
      const [key, value] = label.split('=', 2);
      return {
        key,
        value: value ? value : '',
      };
    });
  }
}
