import {
  MapAbstractFunction,
  MapAbstractFunctionConstructorParameters,
} from './function.abstract';
import { MapEndpoint } from './endpoint';
import { MapGraph } from './graph';
import { MapProtocol } from './protocol';

export class MapFunction extends MapAbstractFunction<
  MapGraph,
  MapEndpoint,
  MapProtocol,
  MapProtocol
> {
  public constructor(
    params: MapAbstractFunctionConstructorParameters<
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
