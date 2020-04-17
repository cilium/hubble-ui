import { MapAbstractEndpoint } from './endpoint.abstract';

export type MapAnyEndpoint = MapAbstractEndpoint<any, any, any, any>;

export { MapEndpoint } from './endpoint.enterprise';
export { MapFunction } from './function.enterprise';
export { MapGraph } from './graph.enterprise';
export { MapProcess } from './process.enterprise';
export { MapProtocol } from './protocol.enterprise';
