import { ServiceCard } from '~/domain/service-card';
import { XY } from '~/domain/geometry';

export interface LayerProps {
  readonly card: ServiceCard;
  readonly coords: XY;
  readonly layer1?: boolean;
  readonly onHeightChange?: (_: number) => void;
}
