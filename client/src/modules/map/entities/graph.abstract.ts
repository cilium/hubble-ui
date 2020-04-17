import { Flow } from '~common/types/graphql';
import {
  MapAbstractEndpoint,
  MapAbstractEndpointFactory,
} from './endpoint.abstract';
import { MapAbstractEntity } from './entity.abstract';
import { MapAbstractFunction } from './function.abstract';
import { MapAbstractProtocol } from './protocol.abstract';

export abstract class MapAbstractGraph<
  Endpoint extends MapAbstractEndpoint<
    MapAbstractGraph<Endpoint, Protocol, Func, EndpointChild>,
    Protocol,
    Func,
    EndpointChild
  >,
  Protocol extends MapAbstractProtocol<
    MapAbstractGraph<Endpoint, Protocol, Func, EndpointChild>,
    Endpoint,
    Func,
    EndpointChild
  >,
  Func extends MapAbstractFunction<
    MapAbstractGraph<Endpoint, Protocol, Func, EndpointChild>,
    Endpoint,
    Protocol,
    EndpointChild
  >,
  EndpointChild extends MapAbstractEntity
> {
  // hash -> MapEndpointType
  protected readonly endpoints: Map<string, Endpoint> = new Map();

  // hash -> MapProtocol
  protected readonly protocols: Map<string, Protocol> = new Map();

  // hash -> MapFunction
  protected readonly functions: Map<string, Func> = new Map();

  // hash -> {hash, hash, ..., hash}
  // stores descendants links (src ----> dst) between endpoints, protocols, functions
  protected readonly descendants: Map<string, Set<string>> = new Map();

  // hash -> {hash, hash, ..., hash}
  // stores ancestors links (src <---- dst) between endpoints, protocols, functions
  protected readonly ancestors: Map<string, Set<string>> = new Map();

  public addFlows(
    flows: Flow[],
    endpointFactory: MapAbstractEndpointFactory<
      MapAbstractGraph<Endpoint, Protocol, Func, EndpointChild>,
      Endpoint,
      Protocol,
      Func,
      EndpointChild
    >,
  ) {
    flows.forEach(flow => {
      if (!flow.source || !flow.destination) {
        return;
      }
      const srcEndpoint = endpointFactory({
        direction: 'source',
        graph: this,
        flow,
      });
      const dstEndpoint = endpointFactory({
        direction: 'destination',
        graph: this,
        flow,
      });
      this.upsertEndpoint('source', srcEndpoint, flow);
      this.upsertEndpoint('destination', dstEndpoint, flow);
      this.linkEndpoints(srcEndpoint, dstEndpoint);
    });
  }

  public getEndpoint(hash: string) {
    const endpoint = this.endpoints.get(hash);
    if (!endpoint) {
      throw new Error(`endpoint with hash=${hash} not exists`);
    }
    return endpoint;
  }

  public getProtocol(hash: string) {
    const protocol = this.protocols.get(hash);
    if (!protocol) {
      throw new Error(`protocol with hash=${hash} not exists`);
    }
    return protocol;
  }

  public getFunction(hash: string) {
    const func = this.functions.get(hash);
    if (!func) {
      throw new Error(`function with hash=${hash} not exists`);
    }
    return func;
  }

  public insertEndpoint(endpoint: Endpoint) {
    this.endpoints.set(endpoint.hash, endpoint);
    this.initLinksSet(endpoint.hash);
  }

  public insertProtocol(protocol: Protocol) {
    this.protocols.set(protocol.hash, protocol);
    this.initLinksSet(protocol.hash);
  }

  public insertFunction(func: Func) {
    this.functions.set(func.hash, func);
    this.initLinksSet(func.hash);
  }

  public upsertEndpoint(
    direction: 'source' | 'destination',
    endpoint: Endpoint,
    flow: Flow,
  ) {
    const existEndpoint = this.endpoints.get(endpoint.hash);
    if (existEndpoint) {
      existEndpoint.extendWith(direction, flow);
    } else {
      this.endpoints.set(endpoint.hash, endpoint);
    }
    if (!this.descendants.has(endpoint.hash)) {
      this.descendants.set(endpoint.hash, new Set());
    }
    if (!this.ancestors.has(endpoint.hash)) {
      this.ancestors.set(endpoint.hash, new Set());
    }
  }

  public linkEndpoints(
    srcEndpointOrHash: string | Endpoint,
    dstEndpointOrHash: string | Endpoint,
  ) {
    const srcEndpoint = this.getEndpoint(getEntityHash(srcEndpointOrHash));
    const dstEndpoint = this.getEndpoint(getEntityHash(dstEndpointOrHash));
    const srcDescendants = this.getLinksOrFail('descendants', srcEndpoint.hash);
    const dstAncestors = this.getLinksOrFail('ancestors', dstEndpoint.hash);
    srcDescendants.add(dstEndpoint.hash);
    dstAncestors.add(srcEndpoint.hash);
  }

  public deleteEndpoint(entityOrHash: string | Endpoint) {
    const hash = getEntityHash(entityOrHash);
    this.endpoints.delete(hash);
    this.descendants.delete(hash);
    this.ancestors.delete(hash);
  }

  public deleteLink(
    srcEntityOrHash: string | MapAbstractEntity,
    dstEntityOrHash: string | MapAbstractEntity,
  ) {
    const srcHash = getEntityHash(srcEntityOrHash);
    const dstHash = getEntityHash(dstEntityOrHash);
    this.descendants.get(srcHash)?.delete(dstHash);
    this.ancestors.get(dstHash)?.delete(srcHash);
  }

  public forEachEndpoint(callback: (endpoint: Endpoint) => void) {
    this.endpoints.forEach(callback);
  }

  public forEachLinkBetweenEndpoints(
    callback: (srcEndpoint: Endpoint, dstEndpoint: Endpoint) => void,
    direction: 'descendants' | 'ancestors' = 'descendants',
  ) {
    this[direction].forEach((dstHashes, srcHash) => {
      const srcEntity = this.getEndpoint(srcHash);
      dstHashes.forEach(dstHash => {
        const dstEndpoint = this.getEndpoint(dstHash);
        callback(srcEntity, dstEndpoint);
      });
    });
  }

  public forEndpointEachLink(
    endpointOrHash: string | Endpoint,
    callback: (dstEndpoint: Endpoint) => void,
    direction: 'descendants' | 'ancestors' = 'descendants',
  ) {
    const endpoint = this.getEndpoint(getEntityHash(endpointOrHash));
    const links = this.getLinksOrFail(direction, endpoint.hash);
    links.forEach(toHash => callback(this.getEndpoint(toHash)));
  }

  public traverse(
    visitor: (endpoint: Endpoint) => void,
    direction: 'descendants' | 'ancestors' = 'descendants',
  ) {
    const visited = new Set<string>();
    this.forEachEndpoint(endpoint =>
      this.visitEndpoint(endpoint, visitor, visited, direction),
    );
  }

  protected initLinksSet(hash: string) {
    if (!this.descendants.has(hash)) {
      this.descendants.set(hash, new Set());
    }
    if (!this.ancestors.has(hash)) {
      this.ancestors.set(hash, new Set());
    }
  }

  protected getLinksOrFail(
    direction: 'descendants' | 'ancestors',
    hash: string,
  ) {
    const links = this[direction].get(hash);
    if (!links) {
      throw new Error(`${links} for with hash=${hash} not exist`);
    }
    return links;
  }

  private visitEndpoint(
    endpoint: Endpoint,
    visitor: (endpoint: Endpoint) => void,
    visited: Set<string>,
    direction: 'descendants' | 'ancestors',
  ) {
    if (visited.has(endpoint.hash)) {
      return;
    }
    visitor(endpoint);
    visited.add(endpoint.hash);
    this.forEndpointEachLink(
      endpoint,
      dstEndpoint =>
        this.visitEndpoint(dstEndpoint, visitor, visited, direction),
      direction,
    );
  }
}

function getEntityHash(entityOrHash: string | MapAbstractEntity) {
  return typeof entityOrHash === 'string' ? entityOrHash : entityOrHash.hash;
}
