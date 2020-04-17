import createHash from 'object-hash';
import { sizes } from '../sizes';
import { MapAbstractEndpoint } from './endpoint.abstract';
import { MapAbstractEntity } from './entity.abstract';
import { MapAbstractFunction } from './function.abstract';
import { MapAbstractGraph } from './graph.abstract';

export abstract class MapAbstractProtocol<
  Graph extends MapAbstractGraph<
    Endpoint,
    MapAbstractProtocol<Graph, Endpoint, Func, EndpointChild>,
    Func,
    EndpointChild
  >,
  Endpoint extends MapAbstractEndpoint<
    Graph,
    MapAbstractProtocol<Graph, Endpoint, Func, EndpointChild>,
    Func,
    EndpointChild
  >,
  Func extends MapAbstractFunction<
    Graph,
    Endpoint,
    MapAbstractProtocol<Graph, Endpoint, Func, EndpointChild>,
    EndpointChild
  >,
  EndpointChild extends MapAbstractEntity
> extends MapAbstractEntity {
  private readonly _hash: string;
  private readonly _endpoint: Endpoint;
  private readonly _parent: EndpointChild;
  private readonly _functions: ReadonlyArray<Func>;
  private readonly _port: number;

  public constructor(params: {
    endpoint: Endpoint;
    parent: EndpointChild;
    port: number;
  }) {
    super();
    this._endpoint = params.endpoint;
    this._parent = params.parent;
    this._port = params.port;
    this._functions = [];
    this._hash = this.calcHash();
  }

  public get graph() {
    return this.endpoint.graph;
  }

  public get endpoint() {
    return this._endpoint;
  }

  public get parent() {
    return this._parent;
  }

  public get port() {
    return this._port;
  }

  public get functions() {
    return this._functions;
  }

  public get hash() {
    return this._hash;
  }

  public get height() {
    return this.calcHeight();
  }

  public clone() {
    return this;
  }

  public destroy() {
    return void 0;
  }

  private calcHash() {
    const hash = createHash([this.port]);
    return `${this.parent.hash};protocol:${hash}`;
  }

  private calcHeight() {
    return this.functions.reduce(
      (h, f) => h + f.height,
      sizes['--endpoint-protocol-height'],
    );
  }
}

export interface MapAbstractProtocolConstructorParameters<
  Graph extends MapAbstractGraph<Endpoint, Protocol, Func, EndpointChild>,
  Endpoint extends MapAbstractEndpoint<Graph, Protocol, Func, EndpointChild>,
  Protocol extends MapAbstractProtocol<Graph, Endpoint, Func, EndpointChild>,
  Func extends MapAbstractFunction<Graph, Endpoint, Protocol, EndpointChild>,
  EndpointChild extends MapAbstractEntity
> {
  endpoint: Endpoint;
  parent: EndpointChild;
  port: number;
}

export type MapAbstractProtocolFactory<
  Graph extends MapAbstractGraph<Endpoint, Protocol, Func, EndpointChild>,
  Endpoint extends MapAbstractEndpoint<Graph, Protocol, Func, EndpointChild>,
  Protocol extends MapAbstractProtocol<Graph, Endpoint, Func, EndpointChild>,
  Func extends MapAbstractFunction<Graph, Endpoint, Protocol, EndpointChild>,
  EndpointChild extends MapAbstractEntity
> = (
  parameters: MapAbstractProtocolConstructorParameters<
    Graph,
    Endpoint,
    Protocol,
    Func,
    EndpointChild
  >,
) => Protocol;
