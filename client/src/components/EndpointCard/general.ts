import { ServiceCard } from '~/domain/service-card';
import { XY } from '~/domain/geometry';

export interface CardProps {
  card: ServiceCard;
  coords: XY;
  layer1?: boolean;
  active?: boolean;
  onHeightChange?: (_: number) => void;
}
