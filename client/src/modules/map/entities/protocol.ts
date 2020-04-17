import {
  MapAbstractProtocol,
  MapAbstractProtocolConstructorParameters,
} from './protocol.abstract';
import { MapEndpoint } from './endpoint';
import { MapFunction } from './function';
import { MapGraph } from './graph';

export class MapProtocol extends MapAbstractProtocol<
  MapGraph,
  MapEndpoint,
  MapFunction,
  MapProtocol
> {
  public constructor(
    params: MapAbstractProtocolConstructorParameters<
      MapGraph,
      MapEndpoint,
      MapProtocol,
      MapFunction,
      MapProtocol
    >,
  ) {
    super(params);
  }
}
