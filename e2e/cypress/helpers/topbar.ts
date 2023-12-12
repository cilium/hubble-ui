import { attributes } from '~e2e/client';

export class Topbar {
  root() {
    const rootRef = cy.queryAttrs(attributes.topbar.selector());

    return rootRef;
  }
}
