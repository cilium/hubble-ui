import _ from 'lodash';

import { Method as HttpMethod } from '~/domain/http';
import { L7Kind, Layer7 } from '~/domain/hubble';
import { WrappedLayer7 } from '~/domain/layer7';

const l7Kinds = new Set(Array.from(Object.values(L7Kind)));

export const getKind = (l7: Layer7): L7Kind => {
  if (l7.http != null) return L7Kind.HTTP;
  if (l7.dns != null) return L7Kind.DNS;
  if (l7.kafka != null) return L7Kind.Kafka;

  return L7Kind.Unknown;
};

export const l7KindToString = (kind: L7Kind): string => {
  if ([L7Kind.HTTP, L7Kind.DNS].includes(kind)) return kind.toUpperCase();

  return _.capitalize(kind);
};

export const parseL7Kind = (kind: string): L7Kind | null => {
  if (l7Kinds.has(kind as any)) return kind as L7Kind;

  return null;
};

export const getEndpointId = (l7: WrappedLayer7): string => {
  if (l7.dns != null) return `DNS ${l7.dns.query}`;
  if (l7.kafka != null) return `Kafka ${l7.kafka.topic}`;
  if (l7.http != null) return httpIdFromParts(l7.http.method, l7.http.parsedUrl.pathname);

  return `<unknown-l7-of-type-${l7.type}>`;
};

export const httpIdFromParts = (method: HttpMethod, pathname: string): string => {
  return `${method} ${pathname}`;
};
