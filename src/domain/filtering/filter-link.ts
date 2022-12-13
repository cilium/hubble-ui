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

  switch (e.direction) {
    case FilterDirection.Both: {
      switch (e.kind) {
        case FilterKind.Identity: {
          if (!sourceIdentityMatch && !destIdentityMatch)
            return e.negative !== false;
          break;
        }
      }
      break;
    }
    case FilterDirection.To: {
      switch (e.kind) {
        case FilterKind.Identity: {
          if (!destIdentityMatch) return e.negative !== false;
          break;
        }
      }
      break;
    }
    case FilterDirection.From: {
      switch (e.kind) {
        case FilterKind.Identity: {
          if (!sourceIdentityMatch) return e.negative !== false;
          break;
        }
      }
      break;
    }
  }

  return !e.negative;
};
