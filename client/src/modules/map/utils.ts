import { MapAnyEndpoint } from './entities';

export function isWorldOrHostEndpoint(endpoint: MapAnyEndpoint) {
  return isWorldEndpoint(endpoint) || isHostEndpoint(endpoint);
}

export function isWorldEndpoint(endpoint: MapAnyEndpoint) {
  return endpoint.labels.some(l => l.key === 'reserved:world');
}

export function isHostEndpoint(endpoint: MapAnyEndpoint) {
  return endpoint.labels.some(l => l.key === 'reserved:host');
}

export function isInitEndpoint(endpoint: MapAnyEndpoint) {
  return endpoint.labels.some(l => l.key === 'reserved:init');
}

export function isClusterEndpoint(endpoint: MapAnyEndpoint) {
  return endpoint.labels.some(l => l.key === 'reserved:cluster');
}

export function isIPEndpoint(endpoint: MapAnyEndpoint) {
  return (
    (endpoint.v4ips.size > 0 || endpoint.v6ips.size > 0) &&
    isWorldEndpoint(endpoint)
  );
}

export function isDNSEndpoint(endpoint: MapAnyEndpoint) {
  return Boolean(endpoint.dns);
}

export function isIngressEndpoint(endpoint: MapAnyEndpoint) {
  return isWorldOrHostEndpoint(endpoint);
}

export function isEgressEndpoint(endpoint: MapAnyEndpoint) {
  return isDNSEndpoint(endpoint) || isIPEndpoint(endpoint);
}
