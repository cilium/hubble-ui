import {
  EventTypeFilter,
  FlowFilter,
} from '~/../../common/src/types/hubble/flow/flow_pb';
import {
  GetFlowsRequest,
  GetFlowsResponse,
} from '~/../../common/src/types/hubble/observer/observer_pb';
import { IStream } from '~/api/general';
import { CiliumEventTypes } from '~/domain/cilium';
import { HubbleFlow } from '~/domain/flows';
import { DataStream, GrpcStream, StreamEvent } from './stream';

export class FlowsStream implements IStream<HubbleFlow[]> {
  public static readonly THROTTLE_DELAY_MS = 5000;

  private stream: DataStream<GetFlowsResponse>;

  public constructor(grpcStream: GrpcStream<GetFlowsResponse>) {
    this.stream = new DataStream<GetFlowsResponse>(
      grpcStream,
      FlowsStream.THROTTLE_DELAY_MS,
    );
  }

  public subscribe(callback: (data: HubbleFlow[]) => void) {
    return this.stream.on(StreamEvent.BATCH_DRAIN, data => {
      if (data.length === 0) return;

      const flows = data.reduce<HubbleFlow[]>((flows, response) => {
        const flow = response.getFlow();
        if (flow && response.hasFlow()) {
          flows.push(flow.toObject() as any);
        }
        return flows;
      }, []);

      callback(flows);
    });
  }

  public stop() {
    this.stream.stop();
  }

  public static buildGrpcRequest({ namespace }: { namespace: string }) {
    const request = new GetFlowsRequest();

    const srcWhitelistBaseFilter = new FlowFilter();
    const dstWhitelistBaseFilter = new FlowFilter();

    const srcBlacklistReservedUnknownFilter = new FlowFilter();
    const dstBlacklistReservedUnknownFilter = new FlowFilter();

    [CiliumEventTypes.DROP, CiliumEventTypes.TRACE].forEach(eventTypeNumber => {
      const eventTypeFilter = new EventTypeFilter();
      eventTypeFilter.setType(eventTypeNumber);
      srcWhitelistBaseFilter.addEventType(eventTypeFilter);
      dstWhitelistBaseFilter.addEventType(eventTypeFilter);
    });

    srcWhitelistBaseFilter.addSourcePod(`${namespace}/`);
    dstWhitelistBaseFilter.addDestinationPod(`${namespace}/`);

    // srcWhitelistBaseFilter.addReply(false);
    // dstWhitelistBaseFilter.addReply(false);

    srcBlacklistReservedUnknownFilter.addSourceLabel('reserved:unknown');
    dstBlacklistReservedUnknownFilter.addDestinationLabel('reserved:unknown');

    const whitelistFilters: FlowFilter[] = [
      srcWhitelistBaseFilter,
      dstWhitelistBaseFilter,
    ];
    const blacklistFilters: FlowFilter[] = [
      srcBlacklistReservedUnknownFilter,
      dstBlacklistReservedUnknownFilter,
    ];

    request.setWhitelistList(whitelistFilters);
    request.setBlacklistList(blacklistFilters);
    request.setFollow(true);

    return request;
  }
}
