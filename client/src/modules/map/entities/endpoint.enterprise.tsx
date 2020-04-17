import * as React from 'react';
import { Flow } from '~common/types/graphql';
import {
  MapAbstractEndpoint,
  MapAbstractEndpointConstructorParameters,
} from './endpoint.abstract';
import { MapAbstractFunction } from './function.abstract';
import { MapFunction } from './function.enterprise';
import { MapAbstractGraph } from './graph.abstract';
import { MapGraph } from './graph.enterprise';
import { MapProcess } from './process.enterprise';
import { MapAbstractProtocol } from './protocol.abstract';
import { MapProtocol } from './protocol.enterprise';

export interface MapEndpointConstructorParameters<
  Graph extends MapAbstractGraph<Endpoint, Protocol, Func, MapProcess>,
  Endpoint extends MapAbstractEndpoint<Graph, Protocol, Func, MapProcess>,
  Protocol extends MapAbstractProtocol<Graph, Endpoint, Func, MapProcess>,
  Func extends MapAbstractFunction<Graph, Endpoint, Protocol, MapProcess>
>
  extends MapAbstractEndpointConstructorParameters<
    Graph,
    Endpoint,
    Protocol,
    Func,
    MapProcess
  > {
  readonly processName: string;
}

export class MapEndpoint extends MapAbstractEndpoint<
  MapGraph,
  MapProtocol,
  MapFunction,
  MapProcess
> {
  public constructor(
    params: MapAbstractEndpointConstructorParameters<
      MapGraph,
      MapEndpoint,
      MapProtocol,
      MapFunction,
      MapProcess
    >,
  ) {
    super(params);
  }

  public renderChildren() {
    return (
      <div>
        {this._children.map(child => {
          return (
            <div key={child.hash}>
              {child.bin} {child.args}
            </div>
          );
        })}
      </div>
    );
  }

  public extendWith(direction: 'source' | 'destination', flow: Flow) {
    if (direction === 'source' && flow.proc) {
      const newProc = new MapProcess({
        endpoint: this,
        bin: flow.proc.bin,
        args: flow.proc.args,
      });
      const proc = this.graph.processes.get(newProc.hash) || newProc;
      if (!Boolean(this._children.find(p => proc === p))) {
        this._children.push(proc);
      }
      this.graph.processes.set(proc.hash, proc);
    }
  }
}
