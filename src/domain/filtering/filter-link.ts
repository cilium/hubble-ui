import { Link } from '~/domain/service-map';
import {
  FilterEntry,
  Kind as FilterKind,
  Direction as FilterDirection,
} from './filter-entry';

import { Filters } from '~/domain/filtering';

export const filterLink = (link: Link, filters: Filters): boolean => {
  if (filters.verdict != null && !link.verdicts.has(filters.verdict)) {
    return false;
  }

  if (link.isDNSRequest && filters.skipKubeDns) return false;

  let ok = !filters.filters?.length;
  filters.filters?.forEach((ff: FilterEntry) => {
    const passed = filterLinkByEntry(link, ff);

    ok = ok || passed;
  });

  return ok;
};

export const filterLinkByEntry = (l: Link, e: FilterEntry): boolean => {
  const sourceIdentityMatch = l.sourceId === e.query;
  const destIdentityMatch = l.destinationId === e.query;

  switch (e.direction) {
    case FilterDirection.Both: {
      switch (e.kind) {
        case FilterKind.Identity: {
          if (!sourceIdentityMatch && !destIdentityMatch) return false;
          break;
        }
      }
      break;
    }
    case FilterDirection.To: {
      switch (e.kind) {
        case FilterKind.Identity: {
          if (!destIdentityMatch) return false;
          break;
        }
      }
      break;
    }
    case FilterDirection.From: {
      switch (e.kind) {
        case FilterKind.Identity: {
          if (!sourceIdentityMatch) return false;
          break;
        }
      }
      break;
    }
  }

  return true;
};
