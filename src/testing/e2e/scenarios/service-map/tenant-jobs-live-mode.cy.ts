import { welcomeScreen } from '~/testing/e2e/helpers/welcome-screen';
import { serviceMap } from '~/testing/e2e/helpers/service-map';
import { Preset } from '~/testing/e2e/helpers/visit';
import { E2E as MapE2E } from '~/components/Map';
import { E2E as TopbarE2E } from '~/components/TopBar';

describe('service map', () => {
  it('renders in live mode', () => {
    const nsList = welcomeScreen.visit({ preset: Preset.TenantJobs }).namespaceList();
    nsList.children().should('have.lengthOf', 1);
    nsList.children().first().should('contain', 'tenant-jobs').click();

    const topbar = cy.query(TopbarE2E.topbarRootTestId);
    topbar.root().should('contain', 'tenant-jobs');

    const cards = cy.query(MapE2E.visibleCardsTestId).children();

    // Coreapi:
    serviceMap.queryCard('coreapi', cards).should('have.lengthOf', 1);
    // EntityOp:
    serviceMap.queryCard('entity-operator', cards).should('have.lengthOf', 1);
    // Loader:
    serviceMap.queryCard('loader', cards).should('have.lengthOf', 1);
    // Elastic:
    serviceMap.queryCard('elasticsearch-master', cards).should('have.lengthOf', 1);
    // Zookeeper:
    serviceMap.queryCard('zookeeper', cards).should('have.lengthOf', 1);
    // Resumes:
    serviceMap.queryCard('resumes', cards).should('have.lengthOf', 1);
    // Kafka:
    serviceMap.queryCard('kafka', cards).should('have.lengthOf', 1);
  });
});
