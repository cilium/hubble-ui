import { MapAbstractEndpoint } from './endpoint.abstract';
import { MapAbstractEntity } from './entity.abstract';
import { MapAbstractGraph } from './graph.abstract';
import { MapAbstractProtocol } from './protocol.abstract';
import { sizes } from '../sizes';

export abstract class MapAbstractFunction<
  Graph extends MapAbstractGraph<
    Endpoint,
    Protocol,
    MapAbstractFunction<Graph, Endpoint, Protocol, EndpointChild>,
    EndpointChild
  >,
  Endpoint extends MapAbstractEndpoint<
    Graph,
    Protocol,
    MapAbstractFunction<Graph, Endpoint, Protocol, EndpointChild>,
    EndpointChild
  >,
  Protocol extends MapAbstractProtocol<
    Graph,
    Endpoint,
    MapAbstractFunction<Graph, Endpoint, Protocol, EndpointChild>,
    EndpointChild
  >,
  EndpointChild extends MapAbstractEntity
> extends MapAbstractEntity {
  private readonly _hash: string;
  private readonly _protocol: Protocol;

  public constructor(params: { protocol: Protocol }) {
    super();
    this._protocol = params.protocol;
    this._hash = this.calcHash();
  }

  public get graph() {
    return this.endpoint.graph;
  }

  public get endpoint() {
    return this.protocol.endpoint;
  }

  public get protocol() {
    return this._protocol;
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

  private calcHash(): string {
    return `${this.protocol.hash};function`;
  }

  private calcHeight() {
    return sizes['--endpoint-function-height'];
  }
}

export interface MapAbstractFunctionConstructorParameters<
  Graph extends MapAbstractGraph<Endpoint, Protocol, Func, EndpointChild>,
  Endpoint extends MapAbstractEndpoint<Graph, Protocol, Func, EndpointChild>,
  Protocol extends MapAbstractProtocol<Graph, Endpoint, Func, EndpointChild>,
  Func extends MapAbstractFunction<Graph, Endpoint, Protocol, EndpointChild>,
  EndpointChild extends MapAbstractEntity
> {
  endpoint: Endpoint;
  protocol: Protocol;
}

export type MapAbstractFunctionFactory<
  Graph extends MapAbstractGraph<Endpoint, Protocol, Func, EndpointChild>,
  Endpoint extends MapAbstractEndpoint<Graph, Protocol, Func, EndpointChild>,
  Protocol extends MapAbstractProtocol<Graph, Endpoint, Func, EndpointChild>,
  Func extends MapAbstractFunction<Graph, Endpoint, Protocol, EndpointChild>,
  EndpointChild extends MapAbstractEntity
> = (
  parameters: MapAbstractFunctionConstructorParameters<
    Graph,
    Endpoint,
    Protocol,
    Func,
    EndpointChild
  >,
) => Func;
