import hash from 'object-hash';
import {
  CiliumEventType,
  Endpoint,
  Ethernet,
  FlowType,
  IFlow,
  IP,
  Layer4,
  Layer7,
  Service,
  Verdict,
} from '~/domain/hubble';

export { IFlow };

export class Flow implements IFlow {
  // TODO: probably some of these field could be private
  public time?: number;
  public verdict: Verdict;
  public dropReason: number;
  public ethernet?: Ethernet;
  public ip?: IP;
  public l4?: Layer4;
  public source?: Endpoint;
  public destination?: Endpoint;
  public type: FlowType;
  public nodeName: string;
  public sourceNamesList: Array<string>;
  public destinationNamesList: Array<string>;
  public l7?: Layer7;
  public reply: boolean;
  public eventType?: CiliumEventType;
  public sourceService?: Service;
  public destinationService?: Service;
  public summary: string;

  private _id: string;

  constructor(flow: IFlow) {
    this.time = flow.time;
    this.verdict = flow.verdict;
    this.dropReason = flow.dropReason;
    this.ethernet = flow.ethernet;
    this.ip = flow.ip;
    this.l4 = flow.l4;
    this.source = flow.source;
    this.destination = flow.destination;
    this.type = flow.type;
    this.nodeName = flow.nodeName;
    this.sourceNamesList = flow.sourceNamesList;
    this.destinationNamesList = flow.destinationNamesList;
    this.l7 = flow.l7;
    this.reply = flow.reply;
    this.eventType = flow.eventType;
    this.sourceService = flow.sourceService;
    this.destinationService = flow.destinationService;
    this.summary = flow.summary;

    this._id = this.buildId();
  }

  public get id() {
    return this._id;
  }

  public get verdictLabel(): string {
    switch (this.verdict) {
      case Verdict.Forwarded:
        return 'forwarded';
      case Verdict.Dropped:
        return 'dropped';
      case Verdict.Unknown:
        return 'unknown';
    }

    console.warn(`wrong verdict data: ${this.verdict}`, this);
    return 'wrong';
  }

  private buildId() {
    return hash([
      [...(this.source?.labelsList || [])].sort(),
      this.verdict,
      this.time,
    ]);
  }
}
