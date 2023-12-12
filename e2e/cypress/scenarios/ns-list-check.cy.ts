import { dashboard, Preset } from '~e2e/cypress/helpers';

import { attributes } from '~e2e/client';

describe('check namespaces availability flags', () => {
  it('should check available namespaces in different sources', () => {
    const nsList = dashboard.visit({ preset: Preset.NSListCheck }).namespaceList();

    // NOTE: Backend sent three namespaces, one of them is only in relay,
    // another is only in timescape, and third one available in relay + timescape
    const listItems = nsList.children();
    listItems.should('have.lengthOf', 1);

    listItems.queryAttrs(attributes.ns.availability(true, false)).should('have.lengthOf', 1);
  });
});
