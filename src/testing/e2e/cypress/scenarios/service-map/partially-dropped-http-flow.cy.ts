import { attributes } from '~e2e/client';
import { IPProtocol } from '~/domain/hubble';
import { serviceMap } from '../../helpers/service-map';
import { Preset } from '../../helpers/visit';

describe('service map with partially dropped traffic', () => {
  const checkHttpEndpointAndDashedArrow = (httpShouldBeThere: boolean) => {
    const cards = cy.queryAttrs(attributes.card.visibleContainer()).children();

    // Verify pod workers:
    serviceMap.queryCard('pod-worker', cards).should('have.lengthOf', 1);
    const echo = serviceMap.queryCard('echo', cards).should('have.lengthOf', 1);

    const ap = echo
      .queryAttrs(attributes.serviceMap.accessPoint(8080, IPProtocol.TCP))
      .should('have.lengthOf', 1);

    ap.queryAttrs(attributes.serviceMap.portSelector()).contains('8080');
    ap.queryAttrs(attributes.serviceMap.l4ProtoSelector()).contains('TCP');

    if (httpShouldBeThere) {
      ap.queryAttrs(attributes.serviceMap.l7ProtoSelector()).contains('HTTP');
    }

    serviceMap.queryCardId(cards, 'echo').then(echoCardId => {
      if (echoCardId == null) return;

      let dashedArrow = serviceMap.queryArrowDuckFeet(echoCardId, 8080);
      let linesContainer = dashedArrow.queryAttrs(
        attributes.serviceMap.linesToAccessPointsSelector(),
      );

      // NOTE: The only line should be dashed one
      serviceMap
        .queryInnerLineToPort(linesContainer, echoCardId, 8080)
        .invoke('attr', 'stroke-dasharray')
        .should('not.be.empty');

      // NOTE: Now lets click on the echo card and expand it
      serviceMap.queryCardHeader('echo', cards).click();

      dashedArrow = serviceMap.queryArrowDuckFeet(echoCardId, 8080);
      linesContainer = dashedArrow.queryAttrs(attributes.serviceMap.linesToAccessPointsSelector());

      // NOTE: When card is expanded, there should be 3 inner arrows
      linesContainer
        .queryAttrKeys([attributes.serviceMap.innerLineAttrName()])
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
