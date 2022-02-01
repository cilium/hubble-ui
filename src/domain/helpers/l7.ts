import _ from 'lodash';
import { L7Kind, Layer7 } from '../hubble';

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

export const getEndpointId = (l7: Layer7): string => {
  if (l7.dns != null) return `DNS ${l7.dns.query}`;
  if (l7.kafka != null) return `Kafka ${l7.kafka.topic}`;
  if (l7.http != null) return `${l7.http.method} ${l7.http.url}`;

  return `<unknown-l7-of-type-${l7.type}>`;
};
