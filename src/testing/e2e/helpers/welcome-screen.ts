import * as visit from './visit';
import { E2E } from '~/components/ServiceMapApp/WelcomeScreen';

export class WelcomeScreen {
  public visit(opts?: visit.Opts): this {
    cy.visit('/', {
      qs: visit.createQueryParams(opts),
    });

    return this;
  }

  public namespaceList() {
    return cy.query(E2E.namespaceListTestId);
  }
}

export const welcomeScreen = new WelcomeScreen();
