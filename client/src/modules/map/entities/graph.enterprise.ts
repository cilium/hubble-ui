import { Flow } from '~common/types/graphql';
import { MapAbstractGraph } from './graph.abstract';
import { MapEndpoint } from './endpoint.enterprise';
import { MapFunction } from './function.enterprise';
import { MapProcess } from './process.enterprise';
import { MapProtocol } from './protocol.enterprise';

export class MapGraph extends MapAbstractGraph<
  MapEndpoint,
  MapProtocol,
  MapFunction,
  MapProcess
> {
  public readonly processes: Map<string, MapProcess> = new Map();

  public constructor({ flows }: { flows: Flow[] }) {
    super();
    this.addFlows(flows, params => new MapEndpoint({ ...params, graph: this }));
  }
}
