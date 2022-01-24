import { StoreFrame } from '~/store/frame';
import ServiceStore from '~/store/stores/service';
import InteractionStore from '~/store/stores/interaction';
import ControlStore from '~/store/stores/controls';

import { Flow } from '~/domain/flows';
import { Link } from '~/domain/link';
import { ServiceCard } from '~/domain/service-map';
import { filterFlow, FilterEntry, FilterDirection } from '~/domain/filtering';

import { Filters, FiltersObject } from '~/domain/filtering';
import {
  flows as tflows,
  services as tsvcs,
  filterEntries,
} from '~/testing/data';
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

  return new StoreFrame(controls, interaction, services);
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

describe('KubeDNS', () => {
  const { regular, regular1 } = tsvcs.sameNamespace;
  const { kubeDNS } = tsvcs;

  test('test 1 - regular to KubeDNS (UDP 53)', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
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
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 2 - two regular services to KubeDNS (UDP 53)', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } =
      thelpers.flowsBetweenServices(regular1, kubeDNS);

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .udp(53)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(4);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 3 - regular to KubeDNS (TCP 8765)', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
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
      .tcp(8765)
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
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 4 - two regular services to KubeDNS (UDP 53 + TCP 8080)', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } =
      thelpers.flowsBetweenServices(regular1, kubeDNS);

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(4);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 5 - two regular services to KubeDNS (TCP 8765)', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } =
      thelpers.flowsBetweenServices(regular1, kubeDNS);

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .tcp(8765)
      .forwarded();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .tcp(8765)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(4);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 6 - regular to KubeDNS (UDP 53 Dropped)', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
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
      .dropped();

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
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 7 - two regular services to KubeDNS (UDP 53 Dropped)', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } =
      thelpers.flowsBetweenServices(regular1, kubeDNS);

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .dropped();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .udp(53)
      .dropped();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(4);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 8 - regular to KubeDNS (TCP 8765 Dropped)', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
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
      .tcp(8765)
      .dropped();

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
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 9 - two regular services to KubeDNS (UDP 53 Dropped + TCP 8080)', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } =
      thelpers.flowsBetweenServices(regular1, kubeDNS);

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .dropped();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(4);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 10 - two regular services to KubeDNS (UDP 53 + TCP 8080 Dropped)', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } =
      thelpers.flowsBetweenServices(regular1, kubeDNS);

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .tcp(8080)
      .dropped();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(4);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 11 - two regular services to KubeDNS (UDP 53 Dropped + TCP 8080 Dropped)', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } =
      thelpers.flowsBetweenServices(regular1, kubeDNS);

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .dropped();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .tcp(8080)
      .dropped();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(4);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 12 - two regular services to KubeDNS (TCP 8765 Dropped)', () => {
    const filterObj = {
      namespace: regular.namespace,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } =
      thelpers.flowsBetweenServices(regular1, kubeDNS);

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .tcp(8765)
      .dropped();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .tcp(8765)
      .dropped();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(4);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 13 - regular to KubeDNS (UDP 53, Skip Flag)', () => {
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

    const { fromAtoB, fromBtoA } = thelpers
      .flowsFromToService(regular, kubeDNS)
      .udp(54000, 53)
      .forwarded();

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

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 14 - two regular services to KubeDNS (UDP 53, Skip Flag)', () => {
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

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } = thelpers
      .flowsFromToService(regular, kubeDNS)
      .udp(54000, 53)
      .forwarded();

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } = thelpers
      .flowsFromToService(regular1, kubeDNS)
      .udp(54001, 53)
      .forwarded();

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .udp(53)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 15 - regular to KubeDNS (TCP 8765, Skip Flag)', () => {
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

    const { fromAtoB, fromBtoA } = thelpers
      .flowsFromToService(regular, kubeDNS)
      .tcp(54001, 8765)
      .forwarded();

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .tcp(8765)
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
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 16 - two regular services to KubeDNS (UDP 53 + TCP 8080, Skip Flag)', () => {
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

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } = thelpers
      .flowsFromToService(regular, kubeDNS)
      .udp(54000, 53)
      .forwarded();

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } = thelpers
      .flowsFromToService(regular1, kubeDNS)
      .tcp(54001, 8080)
      .forwarded();

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 17 - two regular services to KubeDNS (TCP 8765, Skip Flag)', () => {
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

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } = thelpers
      .flowsFromToService(regular, kubeDNS)
      .tcp(54000, 8765)
      .forwarded();

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } = thelpers
      .flowsFromToService(regular1, kubeDNS)
      .tcp(54001, 8765)
      .forwarded();

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .tcp(8765)
      .forwarded();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .tcp(8765)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(4);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 18 - regular to KubeDNS (UDP 53 Dropped, Skip Flag)', () => {
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

    const { fromAtoB, fromBtoA } = thelpers
      .flowsFromToService(regular, kubeDNS)
      .udp(54000, 53)
      .dropped();

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .dropped();

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

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 19 - two regular services to KubeDNS (UDP 53 Dropped, Skip flag)', () => {
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

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } = thelpers
      .flowsFromToService(regular, kubeDNS)
      .udp(54000, 53)
      .dropped();

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } = thelpers
      .flowsFromToService(regular1, kubeDNS)
      .udp(54001, 53)
      .dropped();

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .dropped();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .udp(53)
      .dropped();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 20 - regular to KubeDNS (TCP 8765 Dropped, Skip Flag)', () => {
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

    const { fromAtoB, fromBtoA } = thelpers
      .flowsFromToService(regular, kubeDNS)
      .tcp(54000, 8765)
      .dropped();

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .tcp(8765)
      .dropped();

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
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 21 - two regular services to KubeDNS (UDP 53 Dropped + TCP 8080, Skip Flag)', () => {
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

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } = thelpers
      .flowsFromToService(regular, kubeDNS)
      .udp(54000, 53)
      .dropped();

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } = thelpers
      .flowsFromToService(regular1, kubeDNS)
      .tcp(54001, 8080)
      .forwarded();

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .dropped();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 22 - two regular services to KubeDNS (UDP 53 + TCP 8080 Dropped, Skip Flag)', () => {
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

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } = thelpers
      .flowsFromToService(regular, kubeDNS)
      .udp(54000, 53)
      .forwarded();

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } = thelpers
      .flowsFromToService(regular1, kubeDNS)
      .tcp(54001, 8080)
      .dropped();

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .tcp(8080)
      .dropped();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 23 - two regular services to KubeDNS (UDP 53 Dropped + TCP 8080 Dropped, Skip Flag)', () => {
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

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } = thelpers
      .flowsFromToService(regular, kubeDNS)
      .udp(54000, 53)
      .dropped();

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } = thelpers
      .flowsFromToService(regular1, kubeDNS)
      .tcp(54001, 8080)
      .dropped();

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .dropped();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .tcp(8080)
      .dropped();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 24 - two regular services to KubeDNS (TCP 8765 Dropped, Skip Flag)', () => {
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

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } = thelpers
      .flowsFromToService(regular, kubeDNS)
      .tcp(54000, 8765)
      .forwarded();

    const { fromAtoB: fromR1toKDNS, fromBtoA: fromKDNStoR1 } = thelpers
      .flowsFromToService(regular1, kubeDNS)
      .tcp(54001, 8765)
      .forwarded();

    const linkFromRegularToKubeDNS53 = thelpers
      .linkFromToService(regular, kubeDNS)
      .tcp(8765)
      .dropped();

    const linkFromRegular1ToKubeDNS53 = thelpers
      .linkFromToService(regular1, kubeDNS)
      .tcp(8765)
      .dropped();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromR1toKDNS),
        new Flow(fromKDNStoR1),
      ],
      [
        Link.fromHubbleLink(linkFromRegularToKubeDNS53),
        Link.fromHubbleLink(linkFromRegular1ToKubeDNS53),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(4);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });
});

describe('skip host flag', () => {
  const { host, regular, world, remoteNode, kubeDNS } = tsvcs;

  test('test 1 - no host', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: true,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(
      regular,
      world,
    );

    const linkRegularToWorld = thelpers
      .linkFromToService(regular, world)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkRegularToWorld)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 2 - no host', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: true,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkRtoW = thelpers
      .linkFromToService(regular, world)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkRtoW),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(6);
    expect(links.length).toBe(3);
    expect(svcs.length).toBe(4);
  });

  test('test 3 - host presented', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [],
      skipHost: true,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const { fromAtoB: fromHtoR, fromBtoA: fromRtoH } =
      thelpers.flowsBetweenServices(host, regular);

    const { fromAtoB: fromHtoW, fromBtoA: fromWtoH } =
      thelpers.flowsBetweenServices(host, world);

    const { fromAtoB: fromHtoKDNS, fromBtoA: fromKDNStoH } =
      thelpers.flowsBetweenServices(host, kubeDNS);

    const { fromAtoB: fromHtoRN, fromBtoA: fromRNtoH } =
      thelpers.flowsBetweenServices(host, remoteNode);

    const linkRtoW = thelpers
      .linkFromToService(regular, world)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const linkHtoR = thelpers
      .linkFromToService(host, regular)
      .tcp(8090)
      .forwarded();

    const linkHtoW = thelpers
      .linkFromToService(host, world)
      .tcp(8090)
      .forwarded();

    const linkHtoKDNS = thelpers
      .linkFromToService(host, kubeDNS)
      .tcp(8090)
      .forwarded();

    const linkHtoRN = thelpers
      .linkFromToService(host, remoteNode)
      .tcp(8090)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(host),
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
        new Flow(fromHtoR),
        new Flow(fromRtoH),
        // NOTE: these flows are actually filtered on backend side, because
        // NOTE: default flow filters only allow traffic either NS -> OUTSIDE
        // NOTE: or OUTSIDE -> NS, and such cases as HOST -> WORLD is cosidered
        // NOTE: as OUTSIDE -> OUTSIDE
        new Flow(fromHtoW),
        new Flow(fromWtoH),
        new Flow(fromHtoKDNS),
        new Flow(fromKDNStoH),
        new Flow(fromHtoRN),
        new Flow(fromRNtoH),
      ],
      [
        Link.fromHubbleLink(linkRtoW),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
        Link.fromHubbleLink(linkHtoR),
        Link.fromHubbleLink(linkHtoW),
        Link.fromHubbleLink(linkHtoKDNS),
        Link.fromHubbleLink(linkHtoRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(14);
    expect(rhsData.links.length).toBe(7);
    expect(rhsData.svcs.length).toBe(5);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(6);
    expect(links.length).toBe(3);
    expect(svcs.length).toBe(4);
  });
});

describe('filter entries > world', () => {
  const { host, regular, world, remoteNode, kubeDNS } = tsvcs;

  test('test 1 - from world (link regular -> world)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(
      regular,
      world,
    );

    const linkRegularToWorld = thelpers
      .linkFromToService(regular, world)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkRegularToWorld)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 2 - from world (link world -> regular)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(
      regular,
      world,
    );

    const linkWorldToRegular = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkWorldToRegular)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 3 - from world (link world -> host)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(host, world);

    const linkWorldToHost = thelpers
      .linkFromToService(world, host)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(host), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkWorldToHost)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 4 - from world (link host -> world)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(host, world);

    const linkHostToWorld = thelpers
      .linkFromToService(host, world)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(host), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkHostToWorld)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 5 - from world (link world -> host, host is skipped)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!],
      skipHost: true,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(host, world);

    const linkWorldToHost = thelpers
      .linkFromToService(world, host)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(host), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkWorldToHost)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 6 - from world (KubeDNS, RemoteNode)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 7 - from world (KubeDNS, RemoteNode, skip KubeDNS)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!],
      skipHost: false,
      skipKubeDns: true,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 8 - from world (KubeDNS, RemoteNode, skip RemoteNode)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: true,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 9 - from world (KubeDNS, RemoteNode, skip both)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!],
      skipHost: false,
      skipKubeDns: true,
      skipRemoteNode: true,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 10 - to world (link regular -> world)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(
      regular,
      world,
    );

    const linkRegularToWorld = thelpers
      .linkFromToService(regular, world)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkRegularToWorld)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 11 - to world (link world -> regular)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(
      regular,
      world,
    );

    const linkWorldToRegular = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkWorldToRegular)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 12 - to world (link world -> host)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(host, world);

    const linkWorldToHost = thelpers
      .linkFromToService(world, host)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(host), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkWorldToHost)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 13 - to world (link host -> world)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(host, world);

    const linkHostToWorld = thelpers
      .linkFromToService(host, world)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(host), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkHostToWorld)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 14 - to world (link world -> host, host is skipped)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toLabelWorld!],
      skipHost: true,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(host, world);

    const linkWorldToHost = thelpers
      .linkFromToService(world, host)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(host), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkWorldToHost)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 15 - to world (KubeDNS, RemoteNode)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 16 - to world (KubeDNS, RemoteNode, skip KubeDNS)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: true,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 17 - to world (KubeDNS, RemoteNode, skip RemoteNode)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: true,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 18 - to world (KubeDNS, RemoteNode, skip both)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: true,
      skipRemoteNode: true,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 19 - both world (link regular -> world)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(
      regular,
      world,
    );

    const linkRegularToWorld = thelpers
      .linkFromToService(regular, world)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkRegularToWorld)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 20 - both world (link world -> regular)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(
      regular,
      world,
    );

    const linkWorldToRegular = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkWorldToRegular)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 21 - both world (link world -> host)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(host, world);

    const linkWorldToHost = thelpers
      .linkFromToService(world, host)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(host), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkWorldToHost)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 22 - both world (link host -> world)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(host, world);

    const linkHostToWorld = thelpers
      .linkFromToService(host, world)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(host), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkHostToWorld)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 23 - both world (link world -> host, host is skipped)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothLabelWorld!],
      skipHost: true,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(host, world);

    const linkWorldToHost = thelpers
      .linkFromToService(world, host)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(host), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkWorldToHost)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 24 - both world (KubeDNS, RemoteNode)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 25 - both world (KubeDNS, RemoteNode, skip KubeDNS)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothLabelWorld!],
      skipHost: false,
      skipKubeDns: true,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 26 - both world (KubeDNS, RemoteNode, skip RemoteNode)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: true,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 27 - both world (KubeDNS, RemoteNode, skip both)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothLabelWorld!],
      skipHost: false,
      skipKubeDns: true,
      skipRemoteNode: true,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 28 - from + to world (link regular -> world)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!, filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(
      regular,
      world,
    );

    const linkRegularToWorld = thelpers
      .linkFromToService(regular, world)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkRegularToWorld)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 29 - from + to world (link world -> regular)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!, filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(
      regular,
      world,
    );

    const linkWorldToRegular = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkWorldToRegular)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 30 - from + to world (link world -> host)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!, filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(host, world);

    const linkWorldToHost = thelpers
      .linkFromToService(world, host)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(host), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkWorldToHost)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 31 - from + to world (link host -> world)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!, filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(host, world);

    const linkHostToWorld = thelpers
      .linkFromToService(host, world)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(host), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkHostToWorld)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 32 - from + to world (link world -> host, host is skipped)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!, filterEntries.toLabelWorld!],
      skipHost: true,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenServices(host, world);

    const linkWorldToHost = thelpers
      .linkFromToService(world, host)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(host), new ServiceCard(world)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkWorldToHost)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 33 - from + to world (KubeDNS, RemoteNode)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!, filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 34 - from + to world (KubeDNS, RemoteNode, skip KubeDNS)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!, filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: true,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 35 - from + to world (KubeDNS, RemoteNode, skip RemoteNode)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!, filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: true,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 36 - from + to world (KubeDNS, RemoteNode, skip both)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromLabelWorld!, filterEntries.toLabelWorld!],
      skipHost: false,
      skipKubeDns: true,
      skipRemoteNode: true,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: fromRtoW, fromBtoA: fromWtoR } =
      thelpers.flowsBetweenServices(regular, world);

    const { fromAtoB: fromRtoKDNS, fromBtoA: fromKDNStoR } =
      thelpers.flowsBetweenServices(regular, kubeDNS);

    const { fromAtoB: fromRtoRN, fromBtoA: fromRNtoR } =
      thelpers.flowsBetweenServices(regular, remoteNode);

    const linkWtoR = thelpers
      .linkFromToService(world, regular)
      .tcp(8080)
      .forwarded();

    const linkRtoKDNS = thelpers
      .linkFromToService(regular, kubeDNS)
      .udp(53)
      .forwarded();

    const linkRToRN = thelpers
      .linkFromToService(regular, remoteNode)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(world),
        new ServiceCard(remoteNode),
        new ServiceCard(kubeDNS),
      ],
      [
        new Flow(fromRtoW),
        new Flow(fromWtoR),
        new Flow(fromRtoKDNS),
        new Flow(fromKDNStoR),
        new Flow(fromRtoRN),
        new Flow(fromRNtoR),
      ],
      [
        Link.fromHubbleLink(linkWtoR),
        Link.fromHubbleLink(linkRtoKDNS),
        Link.fromHubbleLink(linkRToRN),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(6);
    expect(rhsData.links.length).toBe(3);
    expect(rhsData.svcs.length).toBe(4);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });
});

describe('filter entries > DNS', () => {
  const { regular, regular1, kubeDNS, apiTwitter, world } = tsvcs;

  test('test 1 - regular -> apiTwitter (to filter)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toDnsTwitterApi!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers
      .flowsFromToService(regular, apiTwitter)
      .tcp(54000, 8081)
      .forwarded();

    const linkRegularToTwitter = thelpers
      .linkFromToService(regular, apiTwitter)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(apiTwitter)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkRegularToTwitter)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 2 - regular -> apiTwitter (from filter)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromDnsTwitterApi!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers
      .flowsFromToService(regular, apiTwitter)
      .tcp(54000, 8081)
      .forwarded();

    const linkRegularToTwitter = thelpers
      .linkFromToService(regular, apiTwitter)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(apiTwitter)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkRegularToTwitter)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 3 - regular -> apiTwitter (both filter)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothDnsTwitterApi!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers
      .flowsFromToService(regular, apiTwitter)
      .tcp(54000, 8081)
      .forwarded();

    const linkRegularToTwitter = thelpers
      .linkFromToService(regular, apiTwitter)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(apiTwitter)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkRegularToTwitter)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 4 - regular -> apiTwitter (from + to filters)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [
        filterEntries.fromDnsTwitterApi!,
        filterEntries.toDnsTwitterApi!,
      ],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers
      .flowsFromToService(regular, apiTwitter)
      .tcp(54000, 8081)
      .forwarded();

    const linkRegularToTwitter = thelpers
      .linkFromToService(regular, apiTwitter)
      .tcp(8080)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(apiTwitter)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [Link.fromHubbleLink(linkRegularToTwitter)],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(1);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 5 - regular <-> apiTwitter, apiTwitter <-> regular2 (to filter)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toDnsTwitterApi!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: regToTwitter, fromBtoA: twitterToReg } = thelpers
      .flowsFromToService(regular, apiTwitter)
      .tcp(54000, 8081)
      .forwarded();

    const { fromAtoB: reg1ToTwitter, fromBtoA: twitterToReg1 } = thelpers
      .flowsFromToService(regular1, apiTwitter)
      .tcp(54001, 8081)
      .forwarded();

    const linkRegularToTwitter = thelpers
      .linkFromToService(regular, apiTwitter)
      .tcp(8081)
      .forwarded();

    const linkRegular1ToTwitter = thelpers
      .linkFromToService(regular1, apiTwitter)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(apiTwitter),
      ],
      [
        new Flow(regToTwitter),
        new Flow(twitterToReg),
        new Flow(reg1ToTwitter),
        new Flow(twitterToReg1),
      ],
      [
        Link.fromHubbleLink(linkRegularToTwitter),
        Link.fromHubbleLink(linkRegular1ToTwitter),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 6 - regular -> apiTwitter, apiTwitter -> regular2 (to filter)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toDnsTwitterApi!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: regToTwitter, fromBtoA: twitterToReg } = thelpers
      .flowsFromToService(regular, apiTwitter)
      .tcp(54000, 8081)
      .forwarded();

    const { fromAtoB: reg1ToTwitter, fromBtoA: twitterToReg1 } = thelpers
      .flowsFromToService(regular1, apiTwitter)
      .tcp(54001, 8081)
      .forwarded();

    const linkRegularToTwitter = thelpers
      .linkFromToService(regular, apiTwitter)
      .tcp(8081)
      .forwarded();

    const linkTwitterToRegular1 = thelpers
      .linkFromToService(apiTwitter, regular1)
      .tcp(54001)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(apiTwitter),
      ],
      [new Flow(regToTwitter), new Flow(twitterToReg1)],
      [
        Link.fromHubbleLink(linkRegularToTwitter),
        Link.fromHubbleLink(linkTwitterToRegular1),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 7 - regular <-> apiTwitter, apiTwitter <-> regular2 (from filter)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromDnsTwitterApi!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: regToTwitter, fromBtoA: twitterToReg } = thelpers
      .flowsFromToService(regular, apiTwitter)
      .tcp(54000, 8081)
      .forwarded();

    const { fromAtoB: reg1ToTwitter, fromBtoA: twitterToReg1 } = thelpers
      .flowsFromToService(regular1, apiTwitter)
      .tcp(54001, 8081)
      .forwarded();

    const linkRegularToTwitter = thelpers
      .linkFromToService(regular, apiTwitter)
      .tcp(8081)
      .forwarded();

    const linkRegular1ToTwitter = thelpers
      .linkFromToService(regular1, apiTwitter)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(apiTwitter),
      ],
      [
        new Flow(regToTwitter),
        new Flow(twitterToReg),
        new Flow(reg1ToTwitter),
        new Flow(twitterToReg1),
      ],
      [
        Link.fromHubbleLink(linkRegularToTwitter),
        Link.fromHubbleLink(linkRegular1ToTwitter),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 8 - regular -> apiTwitter, apiTwitter -> regular2 (from filter)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromDnsTwitterApi!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: regToTwitter, fromBtoA: twitterToReg } = thelpers
      .flowsFromToService(regular, apiTwitter)
      .tcp(54000, 8081)
      .forwarded();

    const { fromAtoB: reg1ToTwitter, fromBtoA: twitterToReg1 } = thelpers
      .flowsFromToService(regular1, apiTwitter)
      .tcp(54001, 8081)
      .forwarded();

    const linkRegularToTwitter = thelpers
      .linkFromToService(regular, apiTwitter)
      .tcp(8081)
      .forwarded();

    const linkTwitterToRegular1 = thelpers
      .linkFromToService(apiTwitter, regular1)
      .tcp(54001)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(apiTwitter),
      ],
      [new Flow(regToTwitter), new Flow(twitterToReg1)],
      [
        Link.fromHubbleLink(linkRegularToTwitter),
        Link.fromHubbleLink(linkTwitterToRegular1),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(1);
    expect(svcs.length).toBe(2);
  });

  test('test 9 - regular <-> apiTwitter, apiTwitter <-> regular2 (both filter)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothDnsTwitterApi!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: regToTwitter, fromBtoA: twitterToReg } = thelpers
      .flowsFromToService(regular, apiTwitter)
      .tcp(54000, 8081)
      .forwarded();

    const { fromAtoB: reg1ToTwitter, fromBtoA: twitterToReg1 } = thelpers
      .flowsFromToService(regular1, apiTwitter)
      .tcp(54001, 8081)
      .forwarded();

    const linkRegularToTwitter = thelpers
      .linkFromToService(regular, apiTwitter)
      .tcp(8081)
      .forwarded();

    const linkRegular1ToTwitter = thelpers
      .linkFromToService(regular1, apiTwitter)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(apiTwitter),
      ],
      [
        new Flow(regToTwitter),
        new Flow(twitterToReg),
        new Flow(reg1ToTwitter),
        new Flow(twitterToReg1),
      ],
      [
        Link.fromHubbleLink(linkRegularToTwitter),
        Link.fromHubbleLink(linkRegular1ToTwitter),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(4);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 10 - regular -> apiTwitter, apiTwitter -> regular2 (both filter)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothDnsTwitterApi!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: regToTwitter, fromBtoA: twitterToReg } = thelpers
      .flowsFromToService(regular, apiTwitter)
      .tcp(54000, 8081)
      .forwarded();

    const { fromAtoB: reg1ToTwitter, fromBtoA: twitterToReg1 } = thelpers
      .flowsFromToService(regular1, apiTwitter)
      .tcp(54001, 8081)
      .forwarded();

    const linkRegularToTwitter = thelpers
      .linkFromToService(regular, apiTwitter)
      .tcp(8081)
      .forwarded();

    const linkTwitterToRegular1 = thelpers
      .linkFromToService(apiTwitter, regular1)
      .tcp(54001)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(apiTwitter),
      ],
      [new Flow(regToTwitter), new Flow(twitterToReg1)],
      [
        Link.fromHubbleLink(linkRegularToTwitter),
        Link.fromHubbleLink(linkTwitterToRegular1),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 10 - regular <-> apiTwitter, apiTwitter <-> regular2 (from + to filters)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [
        filterEntries.fromDnsTwitterApi!,
        filterEntries.toDnsTwitterApi!,
      ],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: regToTwitter, fromBtoA: twitterToReg } = thelpers
      .flowsFromToService(regular, apiTwitter)
      .tcp(54000, 8081)
      .forwarded();

    const { fromAtoB: reg1ToTwitter, fromBtoA: twitterToReg1 } = thelpers
      .flowsFromToService(regular1, apiTwitter)
      .tcp(54001, 8081)
      .forwarded();

    const linkRegularToTwitter = thelpers
      .linkFromToService(regular, apiTwitter)
      .tcp(8081)
      .forwarded();

    const linkRegular1ToTwitter = thelpers
      .linkFromToService(regular1, apiTwitter)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(apiTwitter),
      ],
      [
        new Flow(regToTwitter),
        new Flow(twitterToReg),
        new Flow(reg1ToTwitter),
        new Flow(twitterToReg1),
      ],
      [
        Link.fromHubbleLink(linkRegularToTwitter),
        Link.fromHubbleLink(linkRegular1ToTwitter),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(4);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 11 - regular -> apiTwitter, apiTwitter -> regular2 (from + to filters)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [
        filterEntries.fromDnsTwitterApi!,
        filterEntries.toDnsTwitterApi!,
      ],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB: regToTwitter, fromBtoA: twitterToReg } = thelpers
      .flowsFromToService(regular, apiTwitter)
      .tcp(54000, 8081)
      .forwarded();

    const { fromAtoB: reg1ToTwitter, fromBtoA: twitterToReg1 } = thelpers
      .flowsFromToService(regular1, apiTwitter)
      .tcp(54001, 8081)
      .forwarded();

    const linkRegularToTwitter = thelpers
      .linkFromToService(regular, apiTwitter)
      .tcp(8081)
      .forwarded();

    const linkTwitterToRegular1 = thelpers
      .linkFromToService(apiTwitter, regular1)
      .tcp(54001)
      .forwarded();

    const rhs = prepareFrame(
      [
        new ServiceCard(regular),
        new ServiceCard(regular1),
        new ServiceCard(apiTwitter),
      ],
      [new Flow(regToTwitter), new Flow(twitterToReg1)],
      [
        Link.fromHubbleLink(linkRegularToTwitter),
        Link.fromHubbleLink(linkTwitterToRegular1),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(3);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(2);
    expect(svcs.length).toBe(3);
  });

  test('test 11 - regular <-> regular2 (to filters)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.toDnsTwitterApi!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers
      .flowsFromToService(regular, regular1)
      .tcp(54000, 8081)
      .forwarded();

    const linkRegularToRegular1 = thelpers
      .linkFromToService(regular, regular1)
      .tcp(8081)
      .forwarded();

    const linkRegular1ToRegular = thelpers
      .linkFromToService(regular1, regular)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(regular1)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [
        Link.fromHubbleLink(linkRegularToRegular1),
        Link.fromHubbleLink(linkRegular1ToRegular),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 12 - regular <-> regular2 (from filters)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.fromDnsTwitterApi!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers
      .flowsFromToService(regular, regular1)
      .tcp(54000, 8081)
      .forwarded();

    const linkRegularToRegular1 = thelpers
      .linkFromToService(regular, regular1)
      .tcp(8081)
      .forwarded();

    const linkRegular1ToRegular = thelpers
      .linkFromToService(regular1, regular)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(regular1)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [
        Link.fromHubbleLink(linkRegularToRegular1),
        Link.fromHubbleLink(linkRegular1ToRegular),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 13 - regular <-> regular2 (both filters)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [filterEntries.bothDnsTwitterApi!],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers
      .flowsFromToService(regular, regular1)
      .tcp(54000, 8081)
      .forwarded();

    const linkRegularToRegular1 = thelpers
      .linkFromToService(regular, regular1)
      .tcp(8081)
      .forwarded();

    const linkRegular1ToRegular = thelpers
      .linkFromToService(regular1, regular)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(regular1)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [
        Link.fromHubbleLink(linkRegularToRegular1),
        Link.fromHubbleLink(linkRegular1ToRegular),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 14 - regular <-> regular2 (from + to filters)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [
        filterEntries.toDnsTwitterApi!,
        filterEntries.fromDnsTwitterApi!,
      ],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers
      .flowsFromToService(regular, regular1)
      .tcp(54000, 8081)
      .forwarded();

    const linkRegularToRegular1 = thelpers
      .linkFromToService(regular, regular1)
      .tcp(8081)
      .forwarded();

    const linkRegular1ToRegular = thelpers
      .linkFromToService(regular1, regular)
      .tcp(8081)
      .forwarded();

    const rhs = prepareFrame(
      [new ServiceCard(regular), new ServiceCard(regular1)],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [
        Link.fromHubbleLink(linkRegularToRegular1),
        Link.fromHubbleLink(linkRegular1ToRegular),
      ],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(2);
    expect(rhsData.svcs.length).toBe(2);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });
});

describe('filter entries > pod (only flows)', () => {
  const { regular, regular1, kubeDNS, apiTwitter, world } = tsvcs;
  const [senderPod, receiverPod] = ['crawler-12345', 'service-54321'];

  const fromSenderPod = FilterEntry.newPod(senderPod).setDirection(
    FilterDirection.From,
  );

  const toSenderPod = FilterEntry.newPod(senderPod).setDirection(
    FilterDirection.To,
  );

  const bothSenderPod = FilterEntry.newPod(senderPod).setDirection(
    FilterDirection.Both,
  );

  const fromReceiverPod = FilterEntry.newPod(receiverPod).setDirection(
    FilterDirection.From,
  );

  const toReceiverPod = FilterEntry.newPod(receiverPod).setDirection(
    FilterDirection.To,
  );

  const bothReceiverPod = FilterEntry.newPod(receiverPod).setDirection(
    FilterDirection.Both,
  );

  test('test 1 - from sender pod filter (flows from -> to)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [fromSenderPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame(
      [],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 2 - from sender pod filter (one flow to -> from)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [fromSenderPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame([], [new Flow(fromBtoA)], [], filterObj);

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(1);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 3 - from sender pod filter (flows regular <-> world mixed in)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [fromSenderPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const { fromAtoB: fromRegularToWorld, fromBtoA: fromWorldToRegular } =
      thelpers.flowsBetweenServices(regular, world);

    const rhs = prepareFrame(
      [],
      [
        new Flow(fromAtoB),
        new Flow(fromBtoA),
        new Flow(fromRegularToWorld),
        new Flow(fromWorldToRegular),
      ],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 4 - to sender pod filter (flows from -> to)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [toSenderPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame(
      [],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 5 - to sender pod filter (one flow to -> from)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [toSenderPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame([], [new Flow(fromBtoA)], [], filterObj);

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(1);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 6 - to sender pod filter (flows regular <-> world mixed in)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [toSenderPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const { fromAtoB: fromRegularToWorld, fromBtoA: fromWorldToRegular } =
      thelpers.flowsBetweenServices(regular, world);

    const rhs = prepareFrame(
      [],
      [
        new Flow(fromAtoB),
        new Flow(fromBtoA),
        new Flow(fromRegularToWorld),
        new Flow(fromWorldToRegular),
      ],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 7 - both sender pod filter (flows from <-> to)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [bothSenderPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame(
      [],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 8 - both sender pod filter (one flow to <-> from)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [bothSenderPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame([], [new Flow(fromBtoA)], [], filterObj);

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(1);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 9 - both sender pod filter (flows regular <-> world mixed in)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [bothSenderPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const { fromAtoB: fromRegularToWorld, fromBtoA: fromWorldToRegular } =
      thelpers.flowsBetweenServices(regular, world);

    const rhs = prepareFrame(
      [],
      [
        new Flow(fromAtoB),
        new Flow(fromBtoA),
        new Flow(fromRegularToWorld),
        new Flow(fromWorldToRegular),
      ],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 10 - from/to sender pod filter (flows from <-> to)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [fromSenderPod, toSenderPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame(
      [],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 11 - from/to sender pod filter (one flow to <-> from)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [fromSenderPod, toSenderPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame([], [new Flow(fromBtoA)], [], filterObj);

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(1);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 12 - from/to sender pod filter (flows regular <-> world mixed in)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [fromSenderPod, toSenderPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const { fromAtoB: fromRegularToWorld, fromBtoA: fromWorldToRegular } =
      thelpers.flowsBetweenServices(regular, world);

    const rhs = prepareFrame(
      [],
      [
        new Flow(fromAtoB),
        new Flow(fromBtoA),
        new Flow(fromRegularToWorld),
        new Flow(fromWorldToRegular),
      ],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 13 - from receiver pod filter (flows from -> to)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [fromReceiverPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame(
      [],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 14 - from receiver pod filter (one flow to -> from)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [fromReceiverPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame([], [new Flow(fromBtoA)], [], filterObj);

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(1);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 15 - from receiver pod filter (flows regular <-> world mixed in)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [fromReceiverPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const { fromAtoB: fromRegularToWorld, fromBtoA: fromWorldToRegular } =
      thelpers.flowsBetweenServices(regular, world);

    const rhs = prepareFrame(
      [],
      [
        new Flow(fromAtoB),
        new Flow(fromBtoA),
        new Flow(fromRegularToWorld),
        new Flow(fromWorldToRegular),
      ],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 16 - to receiver pod filter (flows from -> to)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [toReceiverPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame(
      [],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 17 - to receiver pod filter (one flow to -> from)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [toReceiverPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame([], [new Flow(fromBtoA)], [], filterObj);

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(1);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(0);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 18 - to receiver pod filter (flows regular <-> world mixed in)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [toReceiverPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const { fromAtoB: fromRegularToWorld, fromBtoA: fromWorldToRegular } =
      thelpers.flowsBetweenServices(regular, world);

    const rhs = prepareFrame(
      [],
      [
        new Flow(fromAtoB),
        new Flow(fromBtoA),
        new Flow(fromRegularToWorld),
        new Flow(fromWorldToRegular),
      ],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 19 - both receiver pod filter (flows from <-> to)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [bothReceiverPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame(
      [],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 20 - both receiver pod filter (one flow to <-> from)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [bothReceiverPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame([], [new Flow(fromBtoA)], [], filterObj);

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(1);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 21 - both receiver pod filter (flows regular <-> world mixed in)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [bothReceiverPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const { fromAtoB: fromRegularToWorld, fromBtoA: fromWorldToRegular } =
      thelpers.flowsBetweenServices(regular, world);

    const rhs = prepareFrame(
      [],
      [
        new Flow(fromAtoB),
        new Flow(fromBtoA),
        new Flow(fromRegularToWorld),
        new Flow(fromWorldToRegular),
      ],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 22 - from/to receiver pod filter (flows from <-> to)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [fromReceiverPod, toReceiverPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame(
      [],
      [new Flow(fromAtoB), new Flow(fromBtoA)],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(2);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 23 - from/to receiver pod filter (one flow to <-> from)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [fromReceiverPod, toReceiverPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const rhs = prepareFrame([], [new Flow(fromBtoA)], [], filterObj);

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(1);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(1);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });

  test('test 24 - from/to receiver pod filter (flows regular <-> world mixed in)', () => {
    const filterObj = {
      namespace: null,
      verdict: null,
      httpStatus: null,
      filters: [fromReceiverPod, toReceiverPod],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };

    const lhs = prepareFrame([], [], [], filterObj);

    const { fromAtoB, fromBtoA } = thelpers.flowsBetweenPods(
      senderPod,
      receiverPod,
    );

    const { fromAtoB: fromRegularToWorld, fromBtoA: fromWorldToRegular } =
      thelpers.flowsBetweenServices(regular, world);

    const rhs = prepareFrame(
      [],
      [
        new Flow(fromAtoB),
        new Flow(fromBtoA),
        new Flow(fromRegularToWorld),
        new Flow(fromWorldToRegular),
      ],
      [],
      filterObj,
    );

    const rhsData = extractData(rhs);
    expect(rhsData.flows.length).toBe(4);
    expect(rhsData.links.length).toBe(0);
    expect(rhsData.svcs.length).toBe(0);

    lhs.applyFrame(rhs, Filters.fromObject(filterObj));

    const { flows, links, svcs } = extractData(lhs);

    expect(flows.length).toBe(2);
    expect(links.length).toBe(0);
    expect(svcs.length).toBe(0);
  });
});
