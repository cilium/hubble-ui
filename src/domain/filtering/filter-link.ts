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

  const filtered = filters.filters?.some(
    ff => ff.negative && !filterLinkByEntry(link, ff),
  );
  return filtered
    ? false
    : !!filters.filters?.some(
        ff => !ff.negative && filterLinkByEntry(link, ff),
      );
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
