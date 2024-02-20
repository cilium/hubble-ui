import _ from 'lodash';

import { attributes } from '~e2e/client';
import { ids } from '~/ui/ids';

import { Elem } from './common';
import { Preset } from './visit';
import { welcomeScreen } from './weclome-screen';

class ServiceMap {
  public queryCardHeader(caption: string, root?: Elem | null) {
    return (root || cy.root()).queryAttrs(attributes.serviceMap.cardHeader(caption));
  }

  public queryCard(caption: string, root?: Elem | null) {
    return this.queryCardHeader(caption, root).parentAttrs(attributes.card.selector());
  }

  public queryCardId(root: Elem | undefined | null, caption: string | Elem) {
    const elem = _.isString(caption)
      ? (root || cy.root()).queryAttrs(attributes.serviceMap.cardHeader(caption))
      : caption;

    return elem.attrValue(attributes.serviceMap.cardIdAttr);
  }

  public queryArrowDuckFeet(cardId: string, port: number) {
    const arrowsForeground = cy.queryAttrs(attributes.map.arrowsForegroundSelector());
    const connectorId = ids.cardConnector(cardId, [ids.accessPoint(cardId, port)]);

    const duckFeet = arrowsForeground.queryAttrs(attributes.serviceMap.duckFeet(connectorId));
    return duckFeet;
  }

  public queryInnerLineToPort(duckFeet: Elem, cardId: string, port: number) {
    return duckFeet.queryAttrs(attributes.serviceMap.innerLineTo(ids.accessPoint(cardId, port)));
  }

  public openNamespace(
    preset: Preset,
    opts: {
      ns: string;
      totalNamespaces?: number;
    },
  ) {
    const nsList = welcomeScreen.visit({ preset }).namespaceList();
    const nsEntry = attributes.ns.entry(opts.ns);

    nsList.children().should('have.lengthOf', opts.totalNamespaces ?? 1);

    const nsElem = nsList.queryAttrs(nsEntry);
    nsElem.should('contain', opts.ns).click();
  }
}

export const serviceMap = new ServiceMap();
