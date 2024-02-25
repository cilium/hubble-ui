import _ from 'lodash';

import { ids } from '~/ui/ids';

import { Preset } from './visit';
import { welcomeScreen } from './welcome-screen';
import { E2E as WelcomeScreenE2E } from '~/components/ServiceMapApp/WelcomeScreen';
import { E2E as EndpointE2E } from '~/components/EndpointCardHeader';
import { E2E as ServiceMapE2E } from '~/components/ServiceMapArrowRenderer/ServiceMapArrowDuckFeet';
import { E2E as MapE2E } from '~/components/Map';
import { E2E as CardE2E } from '~/components/Card';

export type Elem = Cypress.Chainable<JQuery<HTMLElement>>;

class ServiceMap {
  public queryCardHeader(caption: string, root?: Elem | null) {
    return (root || cy.root()).queryAttrs({
      [EndpointE2E.cardHeaderTestSelector]: caption,
    });
  }

  public queryCard(caption: string, root?: Elem | null) {
    return this.queryCardHeader(caption, root).parentQuery(CardE2E.cardRootTestId);
  }

  public queryCardId(root: Elem | undefined | null, caption: string | Elem) {
    const elem = _.isString(caption)
      ? (root || cy.root()).queryAttrs({
          [EndpointE2E.cardHeaderTestSelector]: caption,
        })
      : caption;

    return elem.attrValue(EndpointE2E.cardIdTestSelector);
  }

  public queryArrowDuckFeet(cardId: string, port: number) {
    const arrowsForeground = cy.query(MapE2E.arrowForegroundTestId);
    const connectorId = ids.cardConnector(cardId, [ids.accessPoint(cardId, port)]);

    const duckFeet = arrowsForeground.queryAttrs({
      [ServiceMapE2E.duckFeetTestSelector]: connectorId,
    });
    return duckFeet;
  }

  public queryInnerLineToPort(duckFeet: Elem, cardId: string, port: number) {
    return duckFeet.queryAttrs({
      [ServiceMapE2E.innerLineTestSelector]: ids.accessPoint(cardId, port),
    });
  }

  public openNamespace(
    preset: Preset,
    opts: {
      ns: string;
      totalNamespaces?: number;
    },
  ) {
    const nsList = welcomeScreen.visit({ preset }).namespaceList();
    const nsEntry = { [WelcomeScreenE2E.namespaceNameTestSelector]: opts.ns };

    nsList.children().should('have.lengthOf', opts.totalNamespaces ?? 1);

    const nsElem = nsList.queryAttrs(nsEntry);
    nsElem.should('contain', opts.ns).click();
  }
}

export const serviceMap = new ServiceMap();
