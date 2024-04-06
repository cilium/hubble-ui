import { action, computed, makeObservable, observable } from 'mobx';

import { AuthType, LinkThroughput, Verdict } from '~/domain/hubble';
import { Vec2, XY, XYWH, rounding, utils as gutils } from '~/domain/geometry';

import { sizes } from '~/ui';
import { Arrow } from '~/ui/layout/abstract/arrows';

import { CardOffsets } from './helpers/card-offsets';

export class AccessPointArrow extends Arrow {
  public connectorId: string | null = null;
  public accessPointId: string | null = null;

  public verdicts: Set<Verdict> = new Set();
  public authTypes: Set<AuthType> = new Set();
  public isEncrypted = false;

  public static new(): AccessPointArrow {
    return new AccessPointArrow();
  }

  constructor() {
    super();
    makeObservable(this);
  }

  @action
  public fromConnector(connectorId: string): this {
    this.connectorId = connectorId;
    return this;
  }

  @action
  public toAccessPoint(accessPointId: string): this {
    this.accessPointId = accessPointId;
    return this;
  }

  @action
  public addVerdicts(verdicts: Set<Verdict>): this {
    verdicts.forEach(v => {
      this.verdicts.add(v);
    });

    return this;
  }

  @action
  public setEncryption(encryption: boolean): this {
    if (this.isEncrypted) return this;

    this.isEncrypted = encryption;
    return this;
  }

  @action
  public addAuthTypes(authTypes: Set<AuthType>): this {
    authTypes.forEach(at => {
      this.authTypes.add(at);
    });

    return this;
  }

  @computed
  public get id(): string {
    return `${this.connectorId ?? ''} -> ${this.accessPointId ?? ''}`;
  }

  @computed
  public get hasAbnormalVerdict(): boolean {
    return this.verdicts.has(Verdict.Dropped) || this.verdicts.has(Verdict.Error);
  }

  @computed
  public get hasAuth(): boolean {
    return this.authTypes.has(AuthType.Spire);
  }
}

export class ServiceMapArrow extends Arrow {
  @observable
  public senderId: string | null = null;
  public senderBBox: XYWH | null = null;

  @observable
  public receiverId: string | null = null;
  public receiverBBox: XYWH | null = null;

  @observable
  private _flowsInfoIndicatorCoords: XY | null = null;

  @observable
  private _linkThroughputs: LinkThroughput[] = [];

  @observable
  public accessPointArrows: Map<string, AccessPointArrow> = new Map();

  // NOTE: An offset in pixels from shifted connector coords
  public static readonly flowsIndicatorOffset = 20;

  public static new(): ServiceMapArrow {
    return new ServiceMapArrow();
  }

  constructor() {
    super();
    makeObservable(this);
  }

  @action
  public from(senderId: string, bbox?: XYWH): this {
    this.senderId = senderId;
    this.senderBBox = bbox || null;
    return this;
  }

  @action
  public to(receiverId: string, bbox?: XYWH): this {
    this.receiverId = receiverId;
    this.receiverBBox = bbox || null;
    return this;
  }

  @action
  public addAccessPointArrow(connectorId: string, apId: string): AccessPointArrow {
    const apArrow = AccessPointArrow.new().fromConnector(connectorId).toAccessPoint(apId);

    this.accessPointArrows.set(apArrow.id, apArrow);
    return apArrow;
  }

  @action
  public addLinkThroughput(lt: LinkThroughput): this {
    this._linkThroughputs.push(lt);
    return this;
  }

  @action
  public buildPointsAroundSenderAndReceiver(offsets: CardOffsets): this {
    // prettier-ignore
    const start = this.start, end = this.end;

    if (
      start == null ||
      end == null ||
      this.senderId == null ||
      this.receiverId == null ||
      this.senderBBox == null ||
      this.receiverBBox == null
    )
      return this;

    const startPoint = Vec2.fromXY(start);
    const endPoint = Vec2.fromXY(end);

    const shiftedStart = startPoint.add({ x: sizes.connectorCardStartGap, y: 0 });
    const shiftedEnd = endPoint.sub({ x: sizes.connectorCardStartGap, y: 0 });

    const receiverIsOnTheLeft = startPoint.x > endPoint.x;
    // NOTE: Receiver card is in front of sender card, so no workaround required
    if (!receiverIsOnTheLeft) {
      this._points.splice(1, 0, shiftedStart, shiftedEnd);
      return this;
    }

    // NOTE: At first, go around the sender bbox
    // TODO: Should we add offsets.around.advance(this.senderId) to padding ?
    const points1 = rounding.goAroundTheBox(
      this.senderBBox,
      shiftedStart,
      shiftedEnd,
      sizes.aroundCardPadX,
      sizes.aroundCardPadY,
    );

    // NOTE: Take the point that is placed after the sender bbox. From this
    // NOTE: point when going towards the receiver, it's impossible to face
    // NOTE: the sender bbox. This point is always defined.
    const senderPoint = points1.at(-1) ?? shiftedStart;
    const aroundOffset = offsets.around.advance(this.receiverId);

    // NOTE: Now we are going around the second box
    const points2 = rounding.goAroundTheBox(
      this.receiverBBox,
      senderPoint,
      shiftedEnd,
      sizes.aroundCardPadX + aroundOffset,
      sizes.aroundCardPadY + aroundOffset,
    );

    // NOTE: We incremented an around offset for receiver before trying to go
    // NOTE: around, but in case when there was no need to go around, we must
    // NOTE: rewind (rollback) the offset counter.
    if (points2.length === 0) offsets.around.rewind(this.receiverId);

    // NOTE: If we went around the receiver box, then the last "around" point
    // NOTE: and shiftedEnd point is not vertically aligned, let's fix it:
    if (points2.length > 0) {
      const lastAroundPoint = points2.at(-1)!;
      const offsetAdvancer = lastAroundPoint.y > senderPoint.y ? offsets.bottom : offsets.top;

      const offset = offsetAdvancer.advance(this.receiverId);

      // TODO: This is not fair offset in case when receiver != sender, thus
      // TODO: vector prolongation should be used.
      // NOTE: Align those two points vertically for better view
      lastAroundPoint.x = end.x - offset;
      shiftedEnd.x = end.x - offset;
    }

    // NOTE: Just put those shifted points + around points from first walk
    // NOTE: in the middle of the start and end.
    this._points.splice(1, 0, shiftedStart, ...points1, ...points2, shiftedEnd);
    this.removeSharpAngleAtConnector(this.points);

    return this;
  }

  @action.bound
  public computeFlowsInfoIndicatorPosition() {
    const shiftedEnd = this._points.at(-2);
    const beforeShiftedEnd = this._points.at(-3);

    if (shiftedEnd == null || beforeShiftedEnd == null) return;

    const indicatorCoords = Vec2.fromXY(beforeShiftedEnd).sub(shiftedEnd).normalize();

    if (Number.isNaN(indicatorCoords.y)) debugger;

    this._flowsInfoIndicatorCoords = Vec2.fromXY(shiftedEnd)
      .addInPlace(indicatorCoords.mul(ServiceMapArrow.flowsIndicatorOffset))
      .xy();
  }

  @computed
  public get id(): string {
    return `${this.senderId ?? ''} -> ${this.receiverId ?? ''}`;
  }

  @computed
  public get linkThroughputs(): LinkThroughput[] {
    return this._linkThroughputs.slice();
  }

  @computed
  public get flowsInfoIndicatorCoords(): XY | null {
    if (this._flowsInfoIndicatorCoords == null) return null;

    return {
      x: this._flowsInfoIndicatorCoords.x,
      y: this._flowsInfoIndicatorCoords.y,
    };
  }

  @action
  private removeSharpAngleAtConnector(points: XY[]) {
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
