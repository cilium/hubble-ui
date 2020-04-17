import {
  MapAbstractProtocol,
  MapAbstractProtocolConstructorParameters,
} from './protocol.abstract';
import { MapEndpoint } from './endpoint.enterprise';
import { MapFunction } from './function.enterprise';
import { MapGraph } from './graph.enterprise';
import { MapProcess } from './process.enterprise';

export class MapProtocol extends MapAbstractProtocol<
  MapGraph,
  MapEndpoint,
  MapFunction,
  MapProcess
> {
  public constructor(
    params: MapAbstractProtocolConstructorParameters<
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
