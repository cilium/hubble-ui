import * as uipb from '~backend/proto/ui/ui_pb';
import * as flowpb from '~backend/proto/flow/flow_pb';

import { EventParams, EventParamsSet } from '~/api/general/event-stream';

import { ReservedLabel, SpecialLabel } from '~/domain/labels';
import { Filters, FilterEntry, FilterKind } from '~/domain/filtering';
import { CiliumEventTypes } from '~/domain/cilium';
import * as helpers from '~/domain/helpers';

export class ProtoFactory {
  public static getEventsRequestFromFilters(
    f: Filters,
    ep: EventParams = EventParamsSet.EventStream,
  ): uipb.GetEventsRequest {
    const req = uipb.GetEventsRequest.create({
      eventTypes: [],
    });

    if (ep.flows) {
      req.eventTypes.push(uipb.EventType.FLOWS);
    }

    if (ep.flow) {
      req.eventTypes.push(uipb.EventType.FLOW);
    }

    if (ep.namespaces) {
      req.eventTypes.push(uipb.EventType.K8S_NAMESPACE_STATE);
    }

    if (ep.services) {
      req.eventTypes.push(uipb.EventType.SERVICE_STATE);
    }

    if (ep.serviceLinks) {
      req.eventTypes.push(uipb.EventType.SERVICE_LINK_STATE);
    }

    if (ep.status) {
      req.eventTypes.push(uipb.EventType.STATUS);
    }

    const [wlFlowFilters, blFlowFilters] = ProtoFactory.flowFiltersFromFilters(f);

    const wlFilters = wlFlowFilters.map(ProtoFactory.eventFilterFromFlowFilter);
    const blFilters = blFlowFilters.map(ProtoFactory.eventFilterFromFlowFilter);

    req.whitelist = wlFilters;
    req.blacklist = blFilters;

    return req;
  }

  public static flowFiltersFromFilters(
    filters: Filters,
  ): [flowpb.FlowFilter[], flowpb.FlowFilter[]] {
    const wlFilters: flowpb.FlowFilter[] = [];
    const blFilters = ProtoFactory.blacklistFlowFilters(filters);

    const positiveEntries = filters.filters?.filter(filter => !filter.negative);
    if (!positiveEntries?.length) {
      const namespace = filters?.namespace;

      if (namespace) {
        const wlSrcFilter = ProtoFactory.baseWhitelistFilter(filters);
        const wlDstFilter = ProtoFactory.baseWhitelistFilter(filters);

        wlSrcFilter.sourcePod.push(`${namespace}/`);
        wlDstFilter.destinationPod.push(`${namespace}/`);

        wlFilters.push(wlSrcFilter, wlDstFilter);
      } else {
        wlFilters.push(ProtoFactory.baseWhitelistFilter(filters));
      }

      return [wlFilters, blFilters];
    }

    positiveEntries.forEach(filter => {
      wlFilters.push(...ProtoFactory.filterEntryWhitelistFilters(filters, filter));
    });

    return [wlFilters, blFilters];
  }

  public static blacklistFlowFilters(filters?: Filters): flowpb.FlowFilter[] {
    const blFilters: flowpb.FlowFilter[] = [];
    const namespace = filters?.namespace;

    const blSrcLabelsFilter = flowpb.FlowFilter.create();
    const blDstLabelsFilter = flowpb.FlowFilter.create();
    blFilters.push(blSrcLabelsFilter, blDstLabelsFilter);

    blSrcLabelsFilter.sourceLabel.push(ReservedLabel.Unknown);
    blDstLabelsFilter.destinationLabel.push(ReservedLabel.Unknown);

    if (filters?.skipHost) {
      blSrcLabelsFilter.sourceLabel.push(ReservedLabel.Host);
      blDstLabelsFilter.destinationLabel.push(ReservedLabel.Host);
    }

    if (filters?.skipKubeDns) {
      blSrcLabelsFilter.sourceLabel.push(SpecialLabel.KubeDNS);

      const blDstKubeDns = flowpb.FlowFilter.create();
      // TODO: consider this line to remove, as if service is Unmanaged, flows to
      // TOOD: 53 port will be allowed; don't forget to fix `filter-flow.ts` too
      blDstKubeDns.destinationLabel.push(SpecialLabel.KubeDNS);
      blDstKubeDns.destinationPort.push('53');
      blFilters.push(blDstKubeDns);
    }

    if (filters?.skipRemoteNode) {
      blSrcLabelsFilter.sourceLabel.push(ReservedLabel.RemoteNode);
      blDstLabelsFilter.destinationLabel.push(ReservedLabel.RemoteNode);
    }

    if (filters?.skipPrometheusApp) {
      blSrcLabelsFilter.sourceLabel.push(SpecialLabel.PrometheusApp);
      blDstLabelsFilter.destinationLabel.push(SpecialLabel.PrometheusApp);
    }

    // filter out intermediate dns requests
    const blSrcLocalDnsFilter = flowpb.FlowFilter.create();
    const blDstLocalDnsFilter = flowpb.FlowFilter.create();
    blSrcLocalDnsFilter.sourceFqdn.push('*.cluster.local*');
    blDstLocalDnsFilter.destinationFqdn.push('*.cluster.local*');
    blFilters.push(blSrcLocalDnsFilter, blDstLocalDnsFilter);

    const blSrcIps: string[] = [];
    const blDstIps: string[] = [];
    const blSrcIdentities: number[] = [];
    const blDstIdentities: number[] = [];
    const blSrcPods: string[] = [];
    const blDstPods: string[] = [];
    filters?.filters
      ?.filter(filter => filter.negative)
      .forEach(filter => {
        const { kind, query } = filter;
        switch (kind) {
          case FilterKind.Label: {
            filter.fromRequired && blSrcLabelsFilter.sourceLabel.push(query);
            filter.toRequired && blDstLabelsFilter.destinationLabel.push(query);
            break;
          }
          case FilterKind.Ip: {
            filter.fromRequired && blSrcIps.push(filter.query);
            filter.toRequired && blDstIps.push(filter.query);
            break;
          }
          case FilterKind.Dns: {
            filter.fromRequired && blSrcLocalDnsFilter.sourceFqdn.push(query);
            filter.toRequired && blDstLocalDnsFilter.destinationFqdn.push(query);
            break;
          }
          case FilterKind.Identity: {
            filter.fromRequired && blSrcIdentities.push(+query);
            filter.toRequired && blDstIdentities.push(+query);
            break;
          }
          case FilterKind.Pod: {
            filter.fromRequired && blSrcPods.push(query);
            filter.toRequired && blDstPods.push(query);
          }
        }
      });

    if (blSrcIps.length) {
      const blSrcIpFilter = flowpb.FlowFilter.create();
      blSrcIps.forEach(e => blSrcIpFilter.sourceIp.push(e));
      blFilters.push(blSrcIpFilter);
    }

    if (blDstIps.length) {
      const blDstIpFilter = flowpb.FlowFilter.create();
      blSrcIps.forEach(e => blDstIpFilter.destinationIp.push(e));
      blFilters.push(blDstIpFilter);
    }

    if (blSrcIdentities.length) {
      const blSrcIdentityFilter = flowpb.FlowFilter.create();
      blSrcIdentities.forEach(e => blSrcIdentityFilter.sourceIdentity.push(e));
      blFilters.push(blSrcIdentityFilter);
    }

    if (blDstIdentities.length) {
      const blDstIdentityFilter = flowpb.FlowFilter.create();
      blDstIdentities.forEach(e => blDstIdentityFilter.destinationIdentity.push(e));
      blFilters.push(blDstIdentityFilter);
    }

    if (blSrcPods.length) {
      const blSrcPodFilter = flowpb.FlowFilter.create();

      blSrcPods.forEach(e => blSrcPodFilter.sourcePod.push(`${namespace}/${e}`));
      blFilters.push(blSrcPodFilter);
    }

    if (blDstPods.length) {
      const blDstPodFilter = flowpb.FlowFilter.create();
      blDstPods.forEach(e => blDstPodFilter.destinationPod.push(`${namespace}/${e}`));
      blFilters.push(blDstPodFilter);
    }

    return blFilters;
  }

  public static baseWhitelistFilter(filters?: Filters): flowpb.FlowFilter {
    const wlFilter = flowpb.FlowFilter.create();

    const eventTypes: CiliumEventTypes[] = [];
    if (filters?.httpStatus) {
      // Filter by http status code allows only l7 event type
      eventTypes.push(CiliumEventTypes.L7);
      wlFilter.httpStatusCode.push(filters.httpStatus);
    }

    eventTypes.forEach(eventTypeNumber => {
      wlFilter.eventType.push(flowpb.EventTypeFilter.create({ type: eventTypeNumber }));
    });

    filters?.verdicts?.forEach(verdict => {
      wlFilter.verdict.push(helpers.verdict.verdictToPb(verdict));
    });

    // TODO: code for handling tcp flags should be here

    wlFilter.reply.push(false);
    return wlFilter;
  }

  public static filterEntryWhitelistFilters(
    filters: Filters,
    filter: FilterEntry,
  ): flowpb.FlowFilter[] {
    const { kind, query } = filter;
    const wlFilters: flowpb.FlowFilter[] = [];

    const podsInNamespace = filters.namespace ? `${filters.namespace}/` : null;
    const pod = filter.podNamespace
      ? `${filter.podNamespace}/${filter.query}`
      : filters.namespace
        ? `${filters.namespace}/${filter.query}`
        : null;

    if (filter.fromRequired) {
      // NOTE: this makes possible to catch flows [outside of ns] -> [ns]
      // NOTE: but flows [ns] -> [outside of ns] are lost...
      const toInside = ProtoFactory.baseWhitelistFilter(filters);
      podsInNamespace && toInside.destinationPod.push(podsInNamespace);

      // NOTE: ...this filter fixes this last case
      const fromInside = ProtoFactory.baseWhitelistFilter(filters);
      podsInNamespace && fromInside.sourcePod.push(podsInNamespace);

      switch (kind) {
        case FilterKind.Label: {
          toInside.sourceLabel.push(query);
          fromInside.sourceLabel.push(query);
          break;
        }
        case FilterKind.Ip: {
          toInside.sourceIp.push(query);
          fromInside.sourceIp.push(query);
          break;
        }
        case FilterKind.Dns: {
          toInside.sourceFqdn.push(query);
          fromInside.sourceFqdn.push(query);
          break;
        }
        case FilterKind.Identity: {
          toInside.sourceIdentity.push(+query);
          fromInside.sourceIdentity.push(+query);
          break;
        }
        case FilterKind.Pod: {
          pod && toInside.sourcePod.push(pod);
          fromInside.sourcePod = [];

          if (pod && podsInNamespace && !pod.startsWith(podsInNamespace)) {
            fromInside.destinationPod.push(podsInNamespace);
          }
          pod && fromInside.sourcePod.push(pod);
          break;
        }
        case FilterKind.Workload: {
          const workload = ProtoFactory.workloadFromFilterEntry(filter);
          if (workload == null) break;

          toInside.sourceWorkload.push(workload);
          fromInside.sourceWorkload.push(workload);
          break;
        }
      }

      wlFilters.push(toInside, fromInside);
    }

    if (filter.toRequired) {
      // NOTE: this makes possible to catch flows [ns] -> [outside of ns]
      // NOTE: but flows [outside of ns] -> [ns] are lost...
      const fromInside = ProtoFactory.baseWhitelistFilter(filters);
      podsInNamespace && fromInside.sourcePod.push(podsInNamespace);

      // NOTE: ...this filter fixes this last case
      const toInside = ProtoFactory.baseWhitelistFilter(filters);
      podsInNamespace && toInside.destinationPod.push(podsInNamespace);

      switch (kind) {
        case FilterKind.Label: {
          fromInside.destinationLabel.push(query);
          toInside.destinationLabel.push(query);
          break;
        }
        case FilterKind.Ip: {
          fromInside.destinationIp.push(query);
          toInside.destinationIp.push(query);
          break;
        }
        case FilterKind.Dns: {
          fromInside.destinationFqdn.push(query);
          toInside.destinationFqdn.push(query);
          break;
        }
        case FilterKind.Identity: {
          fromInside.destinationIdentity.push(+query);
          toInside.destinationIdentity.push(+query);
          break;
        }
        case FilterKind.Pod: {
          pod && fromInside.destinationPod.push(pod);
          toInside.destinationPod = [];

          if (podsInNamespace && pod && !pod.startsWith(podsInNamespace)) {
            toInside.sourcePod.push(podsInNamespace);
          }
          pod && toInside.destinationPod.push(pod);
          break;
        }
        case FilterKind.Workload: {
          const workload = ProtoFactory.workloadFromFilterEntry(filter);
          if (workload == null) break;

          toInside.destinationWorkload.push(workload);
          fromInside.destinationWorkload.push(workload);
          break;
        }
      }

      wlFilters.push(fromInside, toInside);
    }

    return wlFilters;
  }

  public static workloadFromFilterEntry(fe: FilterEntry): flowpb.Workload | null {
    if (!fe.isWorkload || !fe.query || !fe.meta) return null;

    return fe.asWorkload() || null;
  }

  public static eventFilterFromFlowFilter(ff: flowpb.FlowFilter): uipb.EventFilter {
    const filter = uipb.EventFilter.create({
      filter: {
        oneofKind: 'flowFilter',
        flowFilter: ff,
      },
    });

    return filter;
  }

  public static eventsFiltersFromFilters(
    filters: Filters,
  ): [uipb.EventFilter[], uipb.EventFilter[]] {
    const [wlFlowFilters, blFlowFilters] = ProtoFactory.flowFiltersFromFilters(filters);

    const wlFilters = wlFlowFilters.map(ProtoFactory.eventFilterFromFlowFilter);
    const blFilters = blFlowFilters.map(ProtoFactory.eventFilterFromFlowFilter);

    return [wlFilters, blFilters];
  }

  public static eventFiltersFromFlowFilter(flowFilter: flowpb.FlowFilter): uipb.EventFilter {
    const filter = uipb.EventFilter.create();
    filter.filter = {
      oneofKind: 'flowFilter',
      flowFilter,
    };

    return filter;
  }
}
