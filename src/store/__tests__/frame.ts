import { StoreFrame } from '~/store/frame';
import ServiceStore from '~/store/stores/service';
import InteractionStore from '~/store/stores/interaction';
import ControlStore from '~/store/stores/controls';

import { Flow } from '~/domain/flows';
import { Link } from '~/domain/link';
import { ServiceCard } from '~/domain/service-map';
import { filterFlow } from '~/domain/filtering';

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

  return new StoreFrame(interaction, services);
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

describe('skip kube dns flag', () => {
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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

    const {
      fromAtoB: fromHtoR,
      fromBtoA: fromRtoH,
    } = thelpers.flowsBetweenServices(host, regular);

    const {
      fromAtoB: fromHtoW,
      fromBtoA: fromWtoH,
    } = thelpers.flowsBetweenServices(host, world);

    const {
      fromAtoB: fromHtoKDNS,
      fromBtoA: fromKDNStoH,
    } = thelpers.flowsBetweenServices(host, kubeDNS);

    const {
      fromAtoB: fromHtoRN,
      fromBtoA: fromRNtoH,
    } = thelpers.flowsBetweenServices(host, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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

    const {
      fromAtoB: fromRtoW,
      fromBtoA: fromWtoR,
    } = thelpers.flowsBetweenServices(regular, world);

    const {
      fromAtoB: fromRtoKDNS,
      fromBtoA: fromKDNStoR,
    } = thelpers.flowsBetweenServices(regular, kubeDNS);

    const {
      fromAtoB: fromRtoRN,
      fromBtoA: fromRNtoR,
    } = thelpers.flowsBetweenServices(regular, remoteNode);

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
