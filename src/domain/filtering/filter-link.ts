import { Link } from '~/domain/service-map';
import { FilterEntry, Kind as FilterKind, Direction as FilterDirection } from './filter-entry';

import { Filters } from '~/domain/filtering';

export const filterLink = (link: Link, filters: Filters): boolean => {
  if ((filters.verdicts?.size ?? 0) > 0) {
    let hasVerdict = false;
    for (const verdict of filters.verdicts ?? new Set()) {
      if (link.verdicts.has(verdict)) {
        hasVerdict = true;
        break;
      }
    }
    if (!hasVerdict) return false;
  }

  if (link.isDNSRequest && filters.skipKubeDns) return false;

  if (!filters.filters?.length) return true;

  for (const ff of filters.filters) {
    const ffResult = filterLinkByEntry(link, ff);

    if (ff.negative && !ffResult) return false;
    if (!ff.negative && ffResult) return true;
  }
  return false;
};

export const filterLinkByEntry = (l: Link, e: FilterEntry): boolean => {
  const sourceIdentityMatch = l.sourceId === e.query;
  const destIdentityMatch = l.destinationId === e.query;

  let [fromOk, toOk] = [false, false];

  switch (e.kind) {
    case FilterKind.Identity: {
      // TODO: This is wrong, coz sourceId/destinationId is not an identity
      if (e.fromRequired) {
        if (!sourceIdentityMatch && e.negative) return true;
        fromOk = sourceIdentityMatch;
      }
      if (e.toRequired) {
        if (!destIdentityMatch && e.negative) return true;
        toOk = destIdentityMatch;
      }

      break;
    }
    default: {
      if (e.negative && !sourceIdentityMatch && !destIdentityMatch) return true;
      fromOk = true;
      toOk = true;
    }
  }

  return e.negative || fromOk || toOk;
};
