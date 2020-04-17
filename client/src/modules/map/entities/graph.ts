import { Flow } from '~common/types/graphql';
import { MapAbstractGraph } from './graph.abstract';
import { MapEndpoint } from './endpoint';
import { MapFunction } from './function';
import { MapProtocol } from './protocol';

export class MapGraph extends MapAbstractGraph<
  MapEndpoint,
  MapProtocol,
  MapFunction,
  MapProtocol
> {
  public constructor({ flows }: { flows: Flow[] }) {
    super();
    this.addFlows(flows, params => new MapEndpoint(params));
  }
}
