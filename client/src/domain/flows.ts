import * as Hubble from '../../../common/src/types/hubble/flow/flow_pb';

export type IFlow = Hubble.Flow.AsObject;

export {
  FlowType,
  Verdict,
} from '../../../common/src/types/hubble/flow/flow_pb';

export class Flow {
  public data: IFlow;

  constructor(flow: IFlow) {
    this.data = flow;
  }

  public get verdictLabel() {
    switch (this.data.verdict) {
      case Hubble.Verdict.FORWARDED:
        return 'forwarded';
      case Hubble.Verdict.DROPPED:
        return 'dropped';
      case Hubble.Verdict.VERDICT_UNKNOWN:
        return 'unknown';
      default:
        console.warn(`unhandled verdict: ${this.data.verdict}`);
        return 'unhandled';
    }
  }
}
