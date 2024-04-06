import { NSAttributes } from '~e2e/client/attributes/namespaces';
import * as visit from './visit';

export class WelcomeScreen {
  public visit(opts?: visit.Opts): this {
    cy.visit('/', {
      qs: visit.createQueryParams(opts),
    });

    return this;
  }

  public namespaceList() {
    return cy.query(NSAttributes.NS_LIST_SELECTOR);
  }
}

export const welcomeScreen = new WelcomeScreen();
