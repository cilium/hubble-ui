import {
  EventTypeFilter,
  FlowFilter,
} from '~/../../common/src/types/hubble/flow/flow_pb';
import {
  GetFlowsRequest,
  GetFlowsResponse,
} from '~/../../common/src/types/hubble/observer/observer_pb';
import { FlowsStreamParams, IThrottledStream } from '~/api/general';
import { CiliumEventTypes } from '~/domain/cilium';
import {
  HubbleFlow,
  FlowsFilterDirection,
  FlowsFilterKind,
} from '~/domain/flows';
import { DataStream, GrpcStream, StreamEvent } from './stream';

export class FlowsStream implements IThrottledStream<HubbleFlow[]> {
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
    this.stream.stop(true);
  }

  public static buildGrpcRequest(params: FlowsStreamParams) {
    const request = new GetFlowsRequest();

    const srcWhitelistBaseFilter = new FlowFilter();
    const dstWhitelistBaseFilter = new FlowFilter();

    const eventTypes = [CiliumEventTypes.L7];
    if (params.httpStatus) {
      // Filter by http status code allows only l7 event type
      srcWhitelistBaseFilter.addHttpStatusCode(params.httpStatus);
      dstWhitelistBaseFilter.addHttpStatusCode(params.httpStatus);
    } else {
      eventTypes.push(CiliumEventTypes.DROP, CiliumEventTypes.TRACE);
    }
    eventTypes.forEach(eventTypeNumber => {
      const eventTypeFilter = new EventTypeFilter();
      eventTypeFilter.setType(eventTypeNumber);
      srcWhitelistBaseFilter.addEventType(eventTypeFilter);
      dstWhitelistBaseFilter.addEventType(eventTypeFilter);
    });

    srcWhitelistBaseFilter.addSourcePod(`${params.namespace}/`);
    dstWhitelistBaseFilter.addDestinationPod(`${params.namespace}/`);

    if (params.verdict) {
      // TODO: replace "as any" with `verdictToPb`
      srcWhitelistBaseFilter.addVerdict(params.verdict as any);
      dstWhitelistBaseFilter.addVerdict(params.verdict as any);
    }

    params.filters.forEach(filter => {
      switch (filter.direction) {
        case FlowsFilterDirection.Both: {
          switch (filter.kind) {
            case FlowsFilterKind.Label: {
              srcWhitelistBaseFilter.addSourceLabel(filter.query);
              dstWhitelistBaseFilter.addDestinationLabel(filter.query);
              break;
            }
            case FlowsFilterKind.Ip: {
              srcWhitelistBaseFilter.addSourceIp(filter.query);
              dstWhitelistBaseFilter.addDestinationIp(filter.query);
              break;
            }
            case FlowsFilterKind.Dns: {
              srcWhitelistBaseFilter.addSourceFqdn(filter.query);
              dstWhitelistBaseFilter.addDestinationFqdn(filter.query);
              break;
            }
          }
          break;
        }
        case FlowsFilterDirection.From: {
          switch (filter.kind) {
            case FlowsFilterKind.Label: {
              srcWhitelistBaseFilter.addSourceLabel(filter.query);
              break;
            }
            case FlowsFilterKind.Ip: {
              srcWhitelistBaseFilter.addSourceIp(filter.query);
              break;
            }
            case FlowsFilterKind.Dns: {
              srcWhitelistBaseFilter.addSourceFqdn(filter.query);
              break;
            }
          }
          break;
        }
        case FlowsFilterDirection.To: {
          switch (filter.kind) {
            case FlowsFilterKind.Label: {
              dstWhitelistBaseFilter.addDestinationLabel(filter.query);
              break;
            }
            case FlowsFilterKind.Ip: {
              dstWhitelistBaseFilter.addDestinationIp(filter.query);
              break;
            }
            case FlowsFilterKind.Dns: {
              dstWhitelistBaseFilter.addDestinationFqdn(filter.query);
              break;
            }
          }
          break;
        }
      }
    });

    srcWhitelistBaseFilter.addReply(false);
    dstWhitelistBaseFilter.addReply(false);

    const srcBlacklistReservedUnknownFilter = new FlowFilter();
    const dstBlacklistReservedUnknownFilter = new FlowFilter();
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

  public get throttleDelay(): number {
    return FlowsStream.THROTTLE_DELAY_MS;
  }
}
