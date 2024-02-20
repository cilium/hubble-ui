import { attributes } from '~e2e/client';
import { welcomeScreen } from '../../helpers/weclome-screen';
import { serviceMap } from '../../helpers/service-map';
import { Preset } from '../../helpers/visit';
import { topbar } from '../../helpers/topbar';

describe('service map', () => {
  it('renders in live mode', () => {
    const nsList = welcomeScreen.visit({ preset: Preset.TenantJobs }).namespaceList();
    nsList.children().should('have.lengthOf', 1);
    nsList.children().first().should('contain', 'tenant-jobs').click();

    topbar.root().should('contain', 'tenant-jobs');

    const cards = cy.queryAttrs(attributes.card.visibleContainer()).children();

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
