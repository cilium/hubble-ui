import { StoreFrame } from '~/store/frame';
import ServiceStore from '~/store/stores/service';
import InteractionStore from '~/store/stores/interaction';
import ControlStore from '~/store/stores/controls';

import { Flow } from '~/domain/flows';
import { Link } from '~/domain/link';
import { ServiceCard } from '~/domain/service-map';
import { filterFlow } from '~/domain/filtering';

import { Filters, FiltersObject } from '~/domain/filtering';
import { flows as tflows, services as tsvcs } from '~/testing/data';
import { helpers as thelpers } from '~/testing';

const prepareFrame = (
  svcs: ServiceCard[],
  flows: Flow[],
  links: Link[],
  f?: FiltersObject,
): StoreFrame => {
  const controls = new ControlStore();
  f = f ?? Filters.default();
  controls.setFilters(Filters.fromObject(f));

  const interaction = new InteractionStore();
  interaction.setFlows(flows);
  interaction.setLinks(links);

  const services = new ServiceStore();
  svcs.forEach(svc => {
    services.addNewCard(svc);
  });

  return new StoreFrame(interaction, services, controls);
};

const extractData = (frame: StoreFrame) => {
  const flows = frame.interactions.flows;
  const links = frame.interactions.links;
  const svcs = frame.services.cardsList;

  return { flows, links, svcs };
};

describe('fill empty frame', () => {
  test('namespace test 1', () => {
    const filterObj = {
      namespace: tflows.hubbleOne.source!.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);
    const rhs = prepareFrame([], [new Flow(tflows.hubbleOne)], [], filterObj);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));
    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
  });

  test('namespace test 2', () => {
    const filterObj = {
      namespace: 'RANDOM_WRONG_123',
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);
    const rhs = prepareFrame([], [new Flow(tflows.hubbleOne)], [], filterObj);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));
    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
  });
});

describe('kube dns cases', () => {
  const { regular, kubeDNS } = tsvcs.sameNamespace;

  test('test 1 - only kube dns 53 port link', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: true,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(
      regular,
      kubeDNS,
    );

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(kubeDNS)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkFromRegularToKubeDNS53)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 2 - kube dns 53 port link + another', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: true,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(
      regular,
      kubeDNS,
    );

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkFromRegularToKubeDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .tcp(8181)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(kubeDNS)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegularToKubeDNS),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);
    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });
});
