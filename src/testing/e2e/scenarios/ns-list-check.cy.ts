import { welcomeScreen } from '../helpers/welcome-screen';
import { Preset } from '../helpers/visit';
import { E2E } from '~/components/ServiceMapApp/WelcomeScreen';

describe('check namespaces availability flags', () => {
  it('should check available namespaces in different sources', () => {
    const nsList = welcomeScreen.visit({ preset: Preset.NSListCheck }).namespaceList();

    const listItems = nsList.children();
    listItems.should('have.lengthOf', 1);

    listItems
      .queryAttrs({
        [E2E.namespaceNameTestSelector]: 'relay',
      })
      .should('have.lengthOf', 1);
  });
});
