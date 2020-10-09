import { action, computed, observable, reaction } from 'mobx';

import { Vec2, XYWH, rounding, utils as gutils } from '~/domain/geometry';
import { Advancer } from '~/utils/advancer';
import { sizes } from '~/ui/vars';

export enum EndingFigure {
  Circle = 'circle',
  Plate = 'plate',
  Arrow = 'arrow',
  None = 'none',
}

export enum ArrowColor {
  Neutral = 'neutral',
  Green = 'green',
  Red = 'red',
}

export interface InnerEnding {
  endingId: string;

  coords: Vec2;
  colors: Set<ArrowColor>;
}

export interface ArrowEnding {
  endingId: string;
  figure: EndingFigure;
  coords: Vec2;

  // Represents endings inside that place from/to where arrow goes (e.g. access points)
  innerEndings?: Map<string, InnerEnding>;

  // BBox that arrow should bend around in order to proceed
  aroundBBox?: XYWH;
}

export interface Arrow {
  arrowId: string;
  color: ArrowColor;
  noHandles?: boolean;

  start: ArrowEnding;
  end: ArrowEnding;
}

export type ArrowPath = Arrow & {
  points: Vec2[];
};

// { arrowId -> Arrow }
export type ArrowsMap = Map<string, Arrow>;

// { arrowId -> ArrowPath }
export type ArrowPathsMap = Map<string, ArrowPath>;

interface CardOffsets {
  top: Advancer<string, number>;
  bottom: Advancer<string, number>;
  around: Advancer<string, number>;
}

export abstract class ArrowStrategy {
  @observable
  protected arrows: ArrowsMap;
  // NOTE: mark it @computed in impl
  // abstract get arrows(): ArrowsMap;

  constructor() {
    this.arrows = new Map();
  }

  @computed
  public get paths(): ArrowPathsMap {
    const arrows: ArrowPathsMap = new Map();

    // Offsets are used for arrows going around card not to overlap with other
    // arrows that go around the same card. They vary depending on direction:
    // whether it goes from bottom to connector of from top to connector.
    const overlapGap = sizes.arrowOverlapGap;
    const offsets: CardOffsets = {
      top: Advancer.new<string, number>(overlapGap, overlapGap),
      bottom: Advancer.new<string, number>(overlapGap, overlapGap),
      around: Advancer.new<string, number>(overlapGap, sizes.aroundCardPadX),
    };

    this.arrows.forEach((arrow, arrowId) => {
      if (Number.isNaN(arrow.start.coords.y)) debugger;
      if (Number.isNaN(arrow.end.coords.y)) debugger;

      const points = this.makeArrowPath(arrow, offsets);

      arrows.set(arrowId, { ...arrow, points });
    });

    return arrows;
  }

  // NOTE: this function should return points between start and end
  private makeArrowPath(arrow: Arrow, offsets: CardOffsets): Vec2[] {
    const startPoint = arrow.start.coords.clone();
    const endPoint = arrow.end.coords.clone();
    const senderBBox = arrow.start.aroundBBox;
    const receiverBBox = arrow.end.aroundBBox;

    const curveGap = Vec2.from(sizes.connectorCardGap, 0);

    // TODO: make shifting optional
    const shiftedStart = startPoint.add(curveGap);
    const shiftedEnd = endPoint.sub(curveGap);
    let points = [shiftedStart, shiftedEnd];

    const destinationIsBehind = startPoint.x > endPoint.x;

    // NOTE: Receiver card is in front of sender card, so no workaround required
    if (!destinationIsBehind) return points.concat([endPoint]);

    if (senderBBox != null) {
      points = rounding
        .goAroundTheBox(
          senderBBox,
          shiftedStart,
          shiftedEnd,
          sizes.aroundCardPadX,
          sizes.aroundCardPadY,
        )
        .map(Vec2.fromXY);
    }

    if (receiverBBox == null) return points.concat([endPoint]);

    const npoints = points.length;
    // NOTE: This point is always defined (point that see receiver directly)
    const senderPoint = points[npoints - 2];
    const aroundOffset = offsets.around.advance(arrow.end.endingId);

    const lastPoints = rounding
      .goAroundTheBox(
        receiverBBox,
        senderPoint,
        shiftedEnd,
        sizes.aroundCardPadX + aroundOffset,
        sizes.aroundCardPadY + aroundOffset,
      )
      .map(Vec2.fromXY);

    if (lastPoints.length > 2 || senderBBox == receiverBBox) {
      const [a, b] = lastPoints.slice(lastPoints.length - 2);
      const offsetAdvancer = a.y > b.y ? offsets.bottom : offsets.top;
      const offset = offsetAdvancer.advance(arrow.end.endingId);
      const newShiftedEndPoint = arrow.end.coords.clone(-offset);

      // TODO: this is not fair offset, vector prolongation should be used
      const beforeConnector = lastPoints[lastPoints.length - 2];
      beforeConnector.x = newShiftedEndPoint.x;

      this.replaceEnding(lastPoints, [newShiftedEndPoint]);
    }

    if (lastPoints.length === 2) {
      offsets.around.rewind(arrow.end.endingId);
    }

    // replace that segment where we apply goAround
    points.splice(npoints - 2, 2, ...lastPoints);
    points = this.removeSharpAngleAtConnector(points.concat([endPoint]));

    return points;
  }

  // Helper for replacing end of points chain
  // Replacement is an array points, where first point is the same as as last
  // point in src array
  private replaceEnding(src: any[], replacement: any[]) {
    src.splice(src.length - 1, 1, ...replacement);
  }

  private removeSharpAngleAtConnector(points: Vec2[]) {
    // Check angle between last two segments of arrow to avoid sharp angle
    // on connector
    const [a, b, c] = points.slice(points.length - 3);
    const angleThreshold = Math.PI / 9;
    const angle = gutils.angleBetweenSegments(a, b, c);

    if (angle > angleThreshold) return points;

    points.splice(points.length - 2, 1);
    return points;
  }
}
