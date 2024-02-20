import { attributes } from '~e2e/client';
import { welcomeScreen } from '../helpers/weclome-screen';
import { Preset } from '../helpers/visit';

describe('check namespaces availability flags', () => {
  it('should check available namespaces in different sources', () => {
    const nsList = welcomeScreen.visit({ preset: Preset.NSListCheck }).namespaceList();

    const listItems = nsList.children();
    listItems.should('have.lengthOf', 1);

    listItems.queryAttrs(attributes.ns.entry('relay')).should('have.lengthOf', 1);
  });
});
