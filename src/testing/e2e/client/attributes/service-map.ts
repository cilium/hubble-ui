import { SharedParts } from './types';

import { AuthType, IPProtocol, L7Kind, Verdict } from '~/domain/hubble';
import * as helpers from '~/domain/helpers';
import { ServiceCard } from '~/domain/service-map/card';

export class ServiceMapAttributes {
  public static readonly cardIdAttr = 'card-id';

  constructor(private readonly fns: SharedParts) {}

  public get cardIdAttr() {
    return ServiceMapAttributes.cardIdAttr;
  }

  public cardHeader(caption: string) {
    return this.fns.attrs({
      cardHeader: caption,
    });
  }

  public card(card: ServiceCard) {
    return Object.assign(
      this.cardHeader(card.caption),
      this.fns.attrs({
        [ServiceMapAttributes.cardIdAttr]: card.id,
      }),
    );
  }

  public accessPoint(
    port: number,
    l4protocol: IPProtocol,
    l7protocol?: L7Kind,
    _verdicts?: Set<Verdict>,
    _authTypes?: Set<AuthType>,
  ) {
    const obj: any = {
      port,
      l4protocol: helpers.protocol.toString(l4protocol),
    };

    if (l7protocol != null) {
      obj.l7protocol = helpers.l7.l7KindToString(l7protocol);
    }

    if (_verdicts != null) {
      obj.verdicts =
        Array.from(_verdicts || [])
          .map(v => helpers.verdict.toString(v))
          .join('-') || void 0;
    }

    return this.fns.attrs(obj);
  }

  public duckFeet(connectorId: string) {
    return this.fns.attrs({
      ['duck-feet-to-connector-id']: connectorId,
    });
  }

  public linesToAccessPointsSelector() {
    return this.fns.sel('ap-lines');
  }

  public innerLineAttrName() {
    return this.fns.attrName('inner-line');
  }

  public innerLineTo(apId: string) {
    return this.fns.attrs({
      [this.innerLineAttrName()]: apId,
    });
  }

  public connector(connectorId: string) {
    return this.fns.attrs({
      connectorId,
    });
  }

  public portSelector() {
    return this.fns.sel('port');
  }

  public l4ProtoSelector() {
    return this.fns.sel('proto-l4');
  }

  public l7ProtoSelector() {
    return this.fns.sel('proto-l7');
  }

  public arrowsSelector() {
    return this.fns.sel('arrows');
  }

  public arrowBodiesSelector() {
    return this.fns.sel('arrow-bodies');
  }

  public arrowDuckFeetsSelector() {
    return this.fns.sel('arrow-duck-feets');
  }
}
