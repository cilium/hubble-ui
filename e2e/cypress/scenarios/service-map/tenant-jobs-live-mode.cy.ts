import { dashboard, serviceMap, topbar, Preset } from '~e2e/cypress/helpers';
import { attributes } from '~e2e/client';

describe('service map', () => {
  it('renders in live mode', () => {
    const nsList = dashboard.visit({ preset: Preset.TenantJobs }).namespaceList();
    nsList.children().should('have.lengthOf', 1);
    nsList.children().first().should('contain', 'tenant-jobs').click();

    topbar.root().queryAttrs(attributes.ns.availability(true, false)).should('contain', 'tenant-jobs');

    const cards = cy
      .queryAttrs(attributes.card.visibleContainer())
      .children();

    const coreapi = serviceMap.queryCard(cards, 'coreapi').should('have.lengthOf', 1);
    const entityOp = serviceMap.queryCard(cards, 'entity-operator').should('have.lengthOf', 1);
    const loader = serviceMap.queryCard(cards, 'loader').should('have.lengthOf', 1);
    const elastic = serviceMap.queryCard(cards, 'elasticsearch-master').should('have.lengthOf', 1);
    const zookeeper = serviceMap.queryCard(cards, 'zookeeper').should('have.lengthOf', 1);
    const resumes = serviceMap.queryCard(cards, 'resumes').should('have.lengthOf', 1);
    const kafka = serviceMap.queryCard(cards, 'kafka').should('have.lengthOf', 1);
  });
});
