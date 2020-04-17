import createHash from 'object-hash';
import { Dns, Flow, IpVersion, Label } from '~common/types/graphql';
import { sizes } from '../sizes';
import { isWorldEndpoint } from '../utils';
import { MapAbstractEntity } from './entity.abstract';
import { MapAbstractFunction } from './function.abstract';
import { MapAbstractGraph } from './graph.abstract';
import { MapAbstractProtocol } from './protocol.abstract';

export abstract class MapAbstractEndpoint<
  Graph extends MapAbstractGraph<
    MapAbstractEndpoint<Graph, Protocol, Func, EndpointChild>,
    Protocol,
    Func,
    EndpointChild
  >,
  Protocol extends MapAbstractProtocol<
    Graph,
    MapAbstractEndpoint<Graph, Protocol, Func, EndpointChild>,
    Func,
    EndpointChild
  >,
  Func extends MapAbstractFunction<
    Graph,
    MapAbstractEndpoint<Graph, Protocol, Func, EndpointChild>,
    Protocol,
    EndpointChild
  >,
  EndpointChild extends MapAbstractEntity
> extends MapAbstractEntity {
  protected readonly _graph: Graph;
  protected readonly _hash: string;
  protected readonly _labels: ReadonlyArray<Label>;
  protected _v4ips: Set<string>;
  protected _v6ips: Set<string>;
  protected _dns?: Dns | null;
  protected _children: EndpointChild[];

  public constructor(
    params: MapAbstractEndpointConstructorParameters<
      Graph,
      MapAbstractEndpoint<Graph, Protocol, Func, EndpointChild>,
      Protocol,
      Func,
      EndpointChild
    >,
  ) {
    super();
    this._graph = params.graph;
    this._labels = params.flow[params.direction]?.labels || [];
    this._v4ips = new Set();
    this._v6ips = new Set();
    this._children = [];
    this.processFlow(params.direction, params.flow);
    this._hash = this.calcHash();
  }

  public abstract renderChildren(): JSX.Element;

  public abstract extendWith(
    direction: 'source' | 'destination',
    flow: Flow,
  ): void;

  public get graph() {
    return this._graph;
  }

  public get hash() {
    return this._hash;
  }

  public get labels() {
    return this._labels;
  }

  public get v4ips() {
    return this._v4ips;
  }

  public get v6ips() {
    return this._v6ips;
  }

  public get dns() {
    return this._dns;
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

  protected calcHeight() {
    return this._children.reduce((height, child) => {
      return height + child.height;
    }, sizes['--endpoint-shadow-size'] * 2 + sizes['--endpoint-header-height']);
  }

  protected processFlow(direction: 'source' | 'destination', flow: Flow) {
    if (flow.ip && flow.ip[direction]) {
      if (flow.ip?.ipversion === IpVersion.IPV4) {
        this._v4ips.add(flow.ip?.[direction]);
      } else if (flow.ip?.ipversion === IpVersion.IPV6) {
        this._v6ips.add(flow.ip?.[direction]);
      } else {
        throw new Error('Unhandled ip version');
      }
    }

    if (direction === 'destination' && flow.l7) {
      if (flow.l7.dns) {
        this._dns = flow.l7.dns;
      }
    }
  }

  private calcHash(): string {
    const hash =
      isWorldEndpoint(this) && this.dns
        ? createHash(this.dns)
        : isWorldEndpoint(this) && (this.v4ips.size > 0 || this.v6ips.size > 0)
        ? createHash(
            { v4ips: this.v4ips, v6ips: this.v6ips },
            { unorderedArrays: true },
          )
        : createHash(this.labels, { unorderedArrays: true });
    return `endpoint:${hash}`;
  }
}

export interface MapAbstractEndpointConstructorParameters<
  Graph extends MapAbstractGraph<Endpoint, Protocol, Func, EndpointChild>,
  Endpoint extends MapAbstractEndpoint<Graph, Protocol, Func, EndpointChild>,
  Protocol extends MapAbstractProtocol<Graph, Endpoint, Func, EndpointChild>,
  Func extends MapAbstractFunction<Graph, Endpoint, Protocol, EndpointChild>,
  EndpointChild extends MapAbstractEntity
> {
  readonly direction: 'source' | 'destination';
  readonly graph: Graph;
  readonly flow: Flow;
}

export type MapAbstractEndpointFactory<
  Graph extends MapAbstractGraph<Endpoint, Protocol, Func, EndpointChild>,
  Endpoint extends MapAbstractEndpoint<Graph, Protocol, Func, EndpointChild>,
  Protocol extends MapAbstractProtocol<Graph, Endpoint, Func, EndpointChild>,
  Func extends MapAbstractFunction<Graph, Endpoint, Protocol, EndpointChild>,
  EndpointChild extends MapAbstractEntity
> = (
  parameters: MapAbstractEndpointConstructorParameters<
    Graph,
    Endpoint,
    Protocol,
    Func,
    EndpointChild
  >,
) => Endpoint;
