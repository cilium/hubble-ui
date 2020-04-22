import { XYWH, Vec2 } from './geometry';
import { ServiceCard } from './service-card';

export interface PlacementEntry {
  serviceCard: ServiceCard;
  geometry: XYWH;
}

export interface Arrow {
  fromServiceId: string;
  toAccessPointId: string;
}

export type Placement = Array<PlacementEntry>;

export interface ConnectorPlacement {
  senderId: string;
  receiverId: string;
  apId: string;
  position: Vec2;
}

export interface SenderConnector {
  senderId: string;
  receiverId: string;
  apIds: Set<string>;
  position: Vec2;
}

export interface ConnectorArrow {
  connector: SenderConnector;
  points: Array<Vec2>;
}

export interface SenderArrows {
  senderId: string;
  startPoint: Vec2;

  arrows: Map<string, ConnectorArrow>;
}
