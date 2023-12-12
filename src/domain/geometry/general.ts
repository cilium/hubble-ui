import { tooSmall } from '../misc';

export interface XY {
  x: number;
  y: number;
}

export interface WH {
  w: number;
  h: number;
}

export const whComparator = (lhs?: WH | null, rhs?: WH | null): boolean => {
  if (lhs == null && rhs == null) return false;
  if (lhs == null || rhs == null) return true;

  return tooSmall(lhs.w - rhs.w) && tooSmall(lhs.h - rhs.h);
};

export const xyComparator = (lhs?: XY | null, rhs?: XY | null): boolean => {
  if (lhs == null && rhs == null) return false;
  if (lhs == null || rhs == null) return true;

  return tooSmall(lhs.x - rhs.x) && tooSmall(lhs.y - rhs.y);
};
