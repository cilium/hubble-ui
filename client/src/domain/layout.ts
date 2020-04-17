import { XYWH } from './geometry';
import { ServiceCard } from './service-card';

export interface PlacementEntry {
  serviceCard: ServiceCard;
  geometry: XYWH;
}

export type Placement = Array<PlacementEntry>;
