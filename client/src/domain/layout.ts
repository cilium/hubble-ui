import { XYWH } from './geometry';
import { Endpoint } from './endpoint';

export interface PlacementEntry {
  endpoint: Endpoint;
  geometry: XYWH;
}

export type Placement = Array<PlacementEntry>;
