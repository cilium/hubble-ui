import {
  MapAbstractFunction,
  MapAbstractFunctionConstructorParameters,
} from './function.abstract';
import { MapEndpoint } from './endpoint.enterprise';
import { MapGraph } from './graph.enterprise';
import { MapProcess } from './process.enterprise';
import { MapProtocol } from './protocol.enterprise';

export class MapFunction extends MapAbstractFunction<
  MapGraph,
  MapEndpoint,
  MapProtocol,
  MapProcess
> {
  public constructor(
    params: MapAbstractFunctionConstructorParameters<
      MapGraph,
      MapEndpoint,
      MapProtocol,
      MapFunction,
      MapProcess
    >,
  ) {
    super(params);
  }
}
