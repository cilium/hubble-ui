import { XYWH, Vec2 } from './geometry';
import { ServiceCard } from './service-card';

export enum PlacementType {
  INGRESS_FROM_OUTSIDE_NAMESPACE = 'INGRESS_FROM_OUTSIDE_NAMESPACE',
  EGRESS_TO_OUTSIDE_NAMESPACE = 'EGRESS_TO_OUTSIDE_NAMESPACE',
  NAMESPACED_WITH_CONNECTIONS = 'NAMESPACED_WITH_CONNECTIONS',
  NAMESPACED_WITHOUT_CONNECTIONS = 'NAMESPACED_WITHOUT_CONNECTIONS',
}

export interface PlacementMeta {
  position: PlacementType;
  card: ServiceCard;
  weight: number;
  incomingsCnt: number;
  outgoingsCnt: number;
  hasWorldOrHostAsSender: boolean;
  hasWorldAsReceiver: boolean;
}

export interface PlacementEntry extends PlacementMeta {
  geometry: XYWH;
  column: number;
}

export interface PlacementGrid {
  placement: Map<string, PlacementEntry>;
  x: number;
  y: number;
  width: number;
  height: number;
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
