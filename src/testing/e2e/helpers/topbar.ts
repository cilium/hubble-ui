import { E2E } from '~/components/TopBar';
export class Topbar {
  root() {
    const rootRef = cy.query(E2E.topbarRootTestId);

    return rootRef;
  }
}

export const topbar = new Topbar();
