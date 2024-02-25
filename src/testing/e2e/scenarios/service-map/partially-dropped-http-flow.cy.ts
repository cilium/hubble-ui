import { IPProtocol } from '~/domain/hubble';
import { serviceMap } from '~/testing/e2e/helpers/service-map';
import { Preset } from '~/testing/e2e/helpers/visit';
import { E2E as MapE2E } from '~/components/Map';
import { E2E as AccessPointE2E, getAccessPointTestAttributes } from '~/components/AccessPoint';

import { E2E as ServiceMapE2E } from '~/components/ServiceMapArrowRenderer/ServiceMapArrowDuckFeet';

describe('service map with partially dropped traffic', () => {
  const checkHttpEndpointAndDashedArrow = (httpShouldBeThere: boolean) => {
    const cards = cy.query(MapE2E.visibleCardsTestId).children();

    // Verify pod workers:
    serviceMap.queryCard('pod-worker', cards).should('have.lengthOf', 1);
    const echo = serviceMap.queryCard('echo', cards).should('have.lengthOf', 1);

    const ap = echo
      .queryAttrs(getAccessPointTestAttributes(8080, IPProtocol.TCP))
      .should('have.lengthOf', 1);

    ap.query(AccessPointE2E.accessPointPortTestId).contains('8080');
    ap.query(AccessPointE2E.accessPointL4ProtoTestId).contains('TCP');

    if (httpShouldBeThere) {
      ap.query(AccessPointE2E.accessPointL7ProtoTestId).contains('HTTP');
    }

    serviceMap.queryCardId(cards, 'echo').then(echoCardId => {
      if (echoCardId == null) return;

      let dashedArrow = serviceMap.queryArrowDuckFeet(echoCardId, 8080);
      let linesContainer = dashedArrow.query(ServiceMapE2E.accessPointTestId);

      // NOTE: The only line should be dashed one
      serviceMap
        .queryInnerLineToPort(linesContainer, echoCardId, 8080)
        .invoke('attr', 'stroke-dasharray')
        .should('not.be.empty');

      // NOTE: Now lets click on the echo card and expand it
      serviceMap.queryCardHeader('echo', cards).click();

      dashedArrow = serviceMap.queryArrowDuckFeet(echoCardId, 8080);
      linesContainer = dashedArrow.query(ServiceMapE2E.accessPointTestId);

      // NOTE: When card is expanded, there should be 3 inner arrows
      linesContainer
        .queryAttrKeys([ServiceMapE2E.innerLineTestSelector])
        .should('have.lengthOf', 3);
    });
  };

  const nsName = 'default';

  it('checks Live Mode', () => {
    serviceMap.openNamespace(Preset.PartiallyDroppedHttp, {
      ns: nsName,
    });

    checkHttpEndpointAndDashedArrow(true);
  });
});
