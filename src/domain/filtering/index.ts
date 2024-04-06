import { Flow } from '~/domain/flows';
import { FilterEntry, Kind as FilterKind, Direction as FilterDirection } from './filter-entry';

import { Link, ServiceCard } from '~/domain/service-map';
import { LinkConnections } from '~/domain/interactions/connections';
import { Filters, FiltersObject, FiltersKey } from './filters';

import { filterFlow, filterFlowByEntry } from './filter-flow';
import { filterLink, filterLinkByEntry } from './filter-link';
import { filterService, filterServiceByEntry } from './filter-service';
import { FiltersDiff } from './filters-diff';

export { Filters, FiltersObject, FiltersKey };
export { FilterEntry, FilterKind, FilterDirection };
export { filterFlow, filterFlowByEntry };
export { filterLink, filterLinkByEntry };
export { filterService, filterServiceByEntry };
export { FiltersDiff };

export type FilterResult = {
  flows: Flow[];
  links: Link[];
  services: ServiceCard[];
};

// NOTE: some filtering cases explained:
// NOTE: 1) given that we have filterEntry that keeps all flows from service A
// NOTE: to service B. This means that we are not going to show response
// NOTE: flows/links from service B to service A.
export const filter = (
  filters: Filters,
  flows: Flow[],
  cardsMap: Map<string, ServiceCard>,
  connections: LinkConnections,
): FilterResult => {
  const filteredFlows: Flow[] = [];
  const filteredLinks: Link[] = [];

  // NOTE: flows have enough information to be filtered separately
  flows.forEach(f => {
    const passed = filterFlow(f, filters);
    if (!passed) return;

    filteredFlows.push(f);
  });

  const blacklistServices: Set<string> = new Set();
  const blacklistLinks: Set<string> = new Set();
  const newConnections: Map<string, Set<string>> = new Map();

  // NOTE: services do not have that information as we have "direction" filters
  // NOTE: we do not know if card interact with another one
  cardsMap.forEach((card, id) => {
    // NOTE: here we can only drop those cards, which surely not match
    const passed = filterService(card, filters);
    if (!passed) {
      blacklistServices.add(id);
      return;
    }

    // NOTE: if there is no filterEntries then we should traverse all in/out
    // NOTE: connections and use those senders/receivers, otherwise we should
    // NOTE: use those services, who match filterEntries + related to them
    let checkOutgoings = !filters.filters?.length;
    let checkIncomings = checkOutgoings;

    filters.filters?.forEach(filterEntry => {
      if (!filterServiceByEntry(card.service, filterEntry)) return;

      checkOutgoings = checkOutgoings || filterEntry.fromRequired;
      checkIncomings = checkIncomings || filterEntry.toRequired;
    });

    // NOTE: this means that every filterEntry skiped current card, but this
    // NOTE: card can be saved by another card if it is presented in their
    // NOTE: incomings/outgoings map
    if (!checkIncomings && !checkOutgoings) return;

    const incomings = connections.incomings.get(id);
    if (checkIncomings && incomings != null) {
      incomings.forEach((links, senderId) => {
        addSender(newConnections, id, senderId);
      });
    }

    const outgoings = connections.outgoings.get(id);
    if (checkOutgoings && outgoings != null) {
      outgoings.forEach((links, receiverId) => {
        addSender(newConnections, receiverId, id);
      });
    }
  });

  // NOTE: we need this second cycle, cz in the first one we do not know if
  // NOTE: there are other cards connecting to particular one (current)

  const clonedServices: Map<string, ServiceCard> = new Map();
  newConnections.forEach((senderIds, receiverId) => {
    if (blacklistServices.has(receiverId)) return;

    const incomings = connections.incomings.get(receiverId);
    if (incomings == null) return;

    senderIds.forEach(senderId => {
      if (blacklistServices.has(senderId)) return;

      const links = incomings.get(senderId);
      if (links == null) return;

      links.forEach((link, apId) => {
        if (blacklistLinks.has(link.id)) return;

        const passed = filterLink(link, filters);
        if (!passed) {
          blacklistLinks.add(link.id);
          return;
        }

        // NOTE: if we got to this point, then sender and receiver must exist
        // NOTE: and their degrees are definitely !== 0
        ensureService(clonedServices, cardsMap, senderId);
        const receiver = ensureService(clonedServices, cardsMap, receiverId);
        if (receiver == null) return;

        receiver.upsertAccessPointFromLink(link);
        filteredLinks.push(link);
      });
    });
  });

  return {
    flows: filteredFlows,
    links: filteredLinks,
    services: [...clonedServices.values()],
  };
};

// NOTE: connections is { receiverId -> Set(of all sender IDs)
const addSender = (connections: Map<string, Set<string>>, receiverId: string, senderId: string) => {
  if (!connections.has(receiverId)) {
    connections.set(receiverId, new Set());
  }

  const senders = connections.get(receiverId)!;
  senders.add(senderId);
};

const ensureService = (
  clonedServices: Map<string, ServiceCard>,
  originalServices: Map<string, ServiceCard>,
  serviceId: string,
): ServiceCard | null => {
  if (clonedServices.has(serviceId)) {
    return clonedServices.get(serviceId)!;
  }

  const original = originalServices.get(serviceId);
  if (original == null) return null;

  const cloned = original.clone().dropAccessPoints();
  clonedServices.set(serviceId, cloned);

  return cloned;
};
