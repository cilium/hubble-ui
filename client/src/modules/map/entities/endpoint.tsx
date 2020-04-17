import * as React from 'react';
import {
  MapAbstractEndpoint,
  MapAbstractEndpointConstructorParameters,
} from './endpoint.abstract';
import { MapFunction } from './function';
import { MapGraph } from './graph';
import { MapProtocol } from './protocol';

export class MapEndpoint extends MapAbstractEndpoint<
  MapGraph,
  MapProtocol,
  MapFunction,
  MapProtocol
> {
  public constructor(
    params: MapAbstractEndpointConstructorParameters<
      MapGraph,
      MapEndpoint,
      MapProtocol,
      MapFunction,
      MapProtocol
    >,
  ) {
    super(params);
  }

  renderChildren() {
    return <div />;
  }

  extendWith() {
    void 0;
  }
}
