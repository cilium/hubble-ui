/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FlowsTableSidebar } from '~/components/FlowsTable/Sidebar';

import { Flow } from '~/domain/flows';
import { HubbleFlow } from '~/domain/hubble';
import { Filters } from '~/domain/filtering';

import { act, data, fireEvent, React, render } from '~/testing';

interface Expectations {
  title: string;
  // if `body` is omited than test expects no related `title` to be found
  body?: string;
}

const findByTextContent = (elements: NodeListOf<Element>, text: string) => {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.textContent === text) {
      return el;
    }
  }
  return;
};

const renderSidebar = (component: React.ReactElement<any>): HTMLElement => {
  let container: HTMLElement | null = null;

  act(() => {
    container = render(component).container;
  });

  return container!;
};

const runInteractionTests = (container: HTMLElement, onClose: jest.Mock<void>) => {
  fireEvent.click(container.querySelector(`.close`)!);
  expect(onClose.mock.calls.length).toBe(1);
};

const runAppearanceTests = (container: HTMLElement, exps: Expectations) => {
  const titles = container!.querySelectorAll(`.title`)!;
  const titleElement = findByTextContent(titles, exps.title);

  if (exps.body) {
    expect(titleElement).toBeDefined();
    expect(titleElement!.textContent).toBe(exps.title);

    const bodyElement = titleElement!.nextElementSibling;
    expect(bodyElement).toBeDefined();
    expect(bodyElement!.textContent).toBe(exps.body);
  } else {
    expect(titleElement).toBeUndefined();
  }
};

// 1. Testing that sidebar renders (or not) related titles and flow info
// 2. Testing that element under `.close` is clickable
const runTest = (ntest: number, hf: HubbleFlow, exps: Expectations) => {
  const flow = new Flow(hf);
  const filters = Filters.fromObject(Filters.default());

  const onClose = jest.fn(() => void 0);
  describe(`Sidebar: test ${ntest}`, () => {
    let container: HTMLElement | null = null;

    beforeEach(() => {
      container = renderSidebar(
        <FlowsTableSidebar flow={flow} onClose={onClose} filters={filters}></FlowsTableSidebar>,
      );
    });

    test(`visual`, () => {
      runAppearanceTests(container!, exps);
    });

    test(`interactions`, () => {
      runInteractionTests(container!, onClose);
    });
  });
};

// `Verdict` info renders
runTest(1, data.flows.hubbleOne, {
  title: 'Verdict',
  body: 'forwarded',
});

// `Source pod` info renders
runTest(2, data.flows.hubbleOne, {
  title: 'Source pod',
  body: 'sender-a1b2c3',
});

// `Destination pod` info renders
runTest(3, data.flows.hubbleOne, {
  title: 'Destination pod',
  body: 'receiver-d4e5f6',
});

// `Source labels` info renders
runTest(4, data.flows.hubbleOne, {
  title: 'Source labels',
  body: 'app=Sendernamespace=SenderNs',
});

// `Destination labels` info renders
runTest(5, data.flows.hubbleOne, {
  title: 'Destination labels',
  body: 'app=Receivernamespace=ReceiverNs',
});

// `Destination labels` Non-ICMP info renders
runTest(6, data.flows.hubbleOne, {
  title: 'Destination port • protocol',
  body: '80 • TCP',
});

// `Destination labels` ICMPv4 info renders
runTest(7, data.flows.icmpv4Flow, {
  title: 'Destination protocol',
  body: 'ICMPv4',
});

// `Destination labels` ICMPv6 info renders
runTest(8, data.flows.icmpv6Flow, {
  title: 'Destination protocol',
  body: 'ICMPv6',
});

// `Destination DNS` info doesn't render when unavailable
runTest(9, data.flows.hubbleOne, {
  title: 'Destination DNS',
});

// `Destination IP` info doesn't render when unavailable
runTest(10, data.flows.hubbleOne, {
  title: 'Destination IP',
});
