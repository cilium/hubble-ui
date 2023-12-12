import { attributes } from '~e2e/client';

export class ServiceMap {
  queryCard(root: Cypress.Chainable<JQuery<HTMLElement>> | undefined | null, caption: string) {
    return (root || cy.root())
      .queryAttrs(attributes.serviceMap.cardHeader(caption))
      .parentAttrs(attributes.card.selector());
  }
}
