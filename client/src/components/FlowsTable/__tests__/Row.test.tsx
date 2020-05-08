import _ from 'lodash';

import { act, React, render, data, fireEvent } from '~/testing';
import { Row } from '~/components/FlowsTable/Row';

import { Flow } from '~/domain/flows';
import { HubbleFlow } from '~/domain/hubble';

interface Expectations {
  sourceTitle: string;
  destTitle: string;
  destPort: number;
  verdict: string;
}

const renderRow = (elem: React.ReactElement<any>): HTMLElement => {
  let container: HTMLElement | null = null;

  act(() => {
    const component = (
      <table>
        <tbody>{elem}</tbody>
      </table>
    );

    container = render(component).container;
  });

  return container!;
};

const runInteractionTests = (
  container: HTMLElement,
  flow: Flow,
  onSelect: jest.Mock<void>,
) => {
  const tr = container.querySelector('tr')!;
  fireEvent.click(tr);

  const tds = container.querySelectorAll('tr > td');
  tds.forEach(td => {
    fireEvent.click(td);
  });

  expect(onSelect.mock.calls.length).toBe(1 + tds.length);

  _.range(1 + tds.length).forEach((idx: number) => {
    expect(onSelect.mock.calls[idx][0]).toBe(flow);
  });
};

const runVisualTests = (container: HTMLElement, exps: Expectations) => {
  const sourceTitle = container!.querySelector('tr > td');
  const destTitle = container!.querySelector('tr > td:nth-child(2)');
  const destPort = container!.querySelector('tr > td:nth-child(3)');
  const verdictLabel = container!.querySelector('tr > td:nth-child(4)');

  expect(sourceTitle!.textContent!.trim()).toBe(exps.sourceTitle);
  expect(destTitle!.textContent!.trim()).toBe(exps.destTitle);
  expect(destPort!.textContent).toBe(String(exps.destPort));
  expect(verdictLabel!.textContent).toBe(exps.verdict);
};

const runTest = (ntest: number, hf: HubbleFlow, exps: Expectations) => {
  const flow = new Flow(hf);
  const onSelect = jest.fn((f: Flow) => void 0);

  describe(`FlowsTable: Row / test ${ntest}`, () => {
    let container: HTMLElement | null = null;

    beforeEach(() => {
      container = renderRow(
        <Row
          flow={flow}
          selected={false}
          onSelect={onSelect}
          tsUpdateDelay={1000}
        ></Row>,
      );
    });

    test(`visual`, () => {
      runVisualTests(container!, exps);
    });

    test(`interactions`, () => {
      runInteractionTests(container!, flow, onSelect);
    });
  });
};

runTest(1, data.flows.hubbleOne, {
  sourceTitle: 'Sender SenderNs',
  destTitle: 'Receiver ReceiverNs',
  destPort: 80,
  verdict: 'forwarded',
});

runTest(2, data.flows.hubbleNoSourceName, {
  sourceTitle: 'No app name SenderNs',
  destTitle: 'Receiver ReceiverNs',
  destPort: 80,
  verdict: 'forwarded',
});

runTest(3, data.flows.hubbleNoDstName, {
  sourceTitle: 'Sender SenderNs',
  destTitle: 'No app name ReceiverNs',
  destPort: 80,
  verdict: 'forwarded',
});

runTest(4, data.flows.hubbleNoSourceNamespace, {
  sourceTitle: 'Sender',
  destTitle: 'Receiver ReceiverNs',
  destPort: 80,
  verdict: 'forwarded',
});

runTest(5, data.flows.hubbleNoDstNamespace, {
  sourceTitle: 'Sender SenderNs',
  destTitle: 'Receiver',
  destPort: 80,
  verdict: 'forwarded',
});

runTest(6, data.flows.hubbleDropped, {
  sourceTitle: 'Sender SenderNs',
  destTitle: 'Receiver ReceiverNs',
  destPort: 80,
  verdict: 'dropped',
});

runTest(7, data.flows.hubbleVerdictUnknown, {
  sourceTitle: 'Sender SenderNs',
  destTitle: 'Receiver ReceiverNs',
  destPort: 80,
  verdict: 'unknown',
});

// TODO: test className on tr
// TODO: test useFlowTimestamp
