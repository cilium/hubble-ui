import { XY } from '~/domain/geometry/general';
import { XYWH, Sides } from '~/domain/geometry/xywh';
import { distance } from '~/domain/geometry/utils';
import { segmentsIntersection } from '~/domain/geometry/intersections';

interface SideIntersections {
  left: XY | null;
  right: XY | null;
  top: XY | null;
  bottom: XY | null;
}

export const goAroundTheBox = (box: XYWH, from: XY, to: XY, padX: number, padY: number): XY[] => {
  const sides = box.sides;
  const pointsBetween: XY[] = [];

  const pivot1 = getAroundPoint(from, to, sides, padX, padY);
  if (pivot1 == null) {
    return pointsBetween;
  } else {
    pointsBetween.push(pivot1);
  }

  const secondAroundPoint = getAroundPoint(pivot1, to, sides, padX, padY);
  if (secondAroundPoint != null) pointsBetween.push(secondAroundPoint);

  return pointsBetween;
};

// NOTE: This function returns a point near to one of the corners of the box
// NOTE: that can be used to get around this box:
// NOTE:  \ <- This is the direction determined by from and to points.
// NOTE:   \
// NOTE:    \         * <- This is where we can go not to intersect the box.
// NOTE: #==========#      This point is the "around" point.
// NOTE: #          #
// NOTE: #==========#
// NOTE:       \
const getAroundPoint = (from: XY, to: XY, sides: Sides, padX: number, padY: number): XY | null => {
  // console.log('getAroundPoint ', from, to, sides);
  const xsect = {
    top: segmentsIntersection(from, to, ...sides.top),
    bottom: segmentsIntersection(from, to, ...sides.bottom),
    left: segmentsIntersection(from, to, ...sides.left),
    right: segmentsIntersection(from, to, ...sides.right),
  };

  // console.log(`xsect: `, xsect);

  const twoIntersections: XY[] = [];
  xsect.top != null && twoIntersections.push(xsect.top);
  // console.log(`twoIntersections 1: `, twoIntersections);
  xsect.bottom != null && twoIntersections.push(xsect.bottom);
  // console.log(`twoIntersections 2: `, twoIntersections);
  xsect.left != null && twoIntersections.push(xsect.left);
  // console.log(`twoIntersections 3: `, twoIntersections);
  xsect.right != null && twoIntersections.push(xsect.right);
  // console.log(`twoIntersections 4: `, twoIntersections);

  // No intersections effectively
  if (twoIntersections.length < 2) {
    return null;
  }

  // First point should be closer to `from` point
  twoIntersections.sort((a, b) => {
    const aDist = distance(from, a);
    const bDist = distance(from, b);

    return aDist - bDist;
  });

  return getAroundPointByCase(sides, twoIntersections, xsect, padX, padY);
};

// There are 6 cases of how intersections may occure: 4 corner cases
// and 2 direct cases. Having the coordinates of intersections, we can determine
// where should we have new point to go around at least first corner of the box
const getAroundPointByCase = (
  sides: Sides,
  intersections: XY[],
  xsect: SideIntersections,
  padX: number,
  padY: number,
): XY => {
  const [first, second] = intersections;

  const verticalCase =
    (first === xsect.bottom && second === xsect.top) ||
    (first === xsect.top && second === xsect.bottom);

  const horizontalCase =
    (first === xsect.left && second === xsect.right) ||
    (first === xsect.right && second === xsect.left);

  const topLeftCase =
    (first === xsect.left && second === xsect.top) ||
    (first === xsect.top && second === xsect.left);

  const topRightCase =
    (first === xsect.right && second === xsect.top) ||
    (first === xsect.top && second === xsect.right);

  const bottomRightCase =
    (first === xsect.bottom && second === xsect.right) ||
    (first === xsect.right && second === xsect.bottom);

  const bottomLeftCase =
    (first === xsect.bottom && second === xsect.left) ||
    (first === xsect.left && second === xsect.bottom);

  // prettier-ignore
  let x = 0, y = 0;

  const bottomY = sides.bottom[0].y;
  const topY = sides.top[0].y;
  const leftX = sides.left[0].x;
  const rightX = sides.right[0].x;

  // All cases are independent
  if (verticalCase) {
    const midX = (leftX + rightX) / 2;
    const keepLeft = (second.x + first.x) / 2 < midX && second.x < first.x;

    x = keepLeft ? leftX - padX : rightX + padX;
    y = first === xsect.bottom ? bottomY + padY : topY - padY;
  }

  if (horizontalCase) {
    const midY = (bottomY + topY) / 2;
    const keepTop = (second.y + first.y) / 2 < midY && second.y < first.y;

    y = keepTop ? topY - padY : bottomY + padY;
    x = first === xsect.left ? leftX - padX : rightX + padX;
  }

  if (topLeftCase) {
    x = leftX - padX;
    y = topY - padY;
  }

  if (topRightCase) {
    x = rightX + padX;
    y = topY - padY;
  }

  if (bottomRightCase) {
    x = rightX + padX;
    y = bottomY + padY;
  }

  if (bottomLeftCase) {
    x = leftX - padX;
    y = bottomY + padY;
  }

  return { x, y };
};
