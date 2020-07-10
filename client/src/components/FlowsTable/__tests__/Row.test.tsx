import _ from 'lodash';

import { act, React, render, data, fireEvent } from '~/testing';
import { Row } from '~/components/FlowsTable/Row';
import {
  TickerEvents,
  DEFAULT_TS_UPDATE_DELAY,
} from '~/components/DetailsPanel';

import { Flow } from '~/domain/flows';
import { HubbleFlow } from '~/domain/hubble';
import { elapsedInWords } from '~/utils/time';
import { Ticker } from '~/utils/ticker';

const tsUpdateDelay = 5000;

jest.useFakeTimers();

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

const runAppearanceTests = (
  container: HTMLElement,
  exps: Expectations,
  selected: boolean,
) => {
  const tr = container!.querySelector('tr')!;

  const sourceTitle = tr.querySelector('td:nth-child(3)');
  const destTitle = tr.querySelector('td:nth-child(6)');
  const destPort = tr.querySelector('td:nth-child(7)');
  const verdictLabel = tr.querySelector('td:nth-child(8)');

  expect(sourceTitle!.textContent!.trim()).toBe(exps.sourceTitle);
  expect(destTitle!.textContent!.trim()).toBe(exps.destTitle);
  expect(destPort!.textContent).toBe(String(exps.destPort));
  expect(verdictLabel!.textContent).toBe(exps.verdict);

  if (selected) {
    expect(tr.className).toContain('selected');
  } else {
    expect(tr.className).not.toContain('selected');
  }
};

const runTemporalTests = (container: HTMLElement, flow: Flow) => {
  jest.clearAllTimers();
  const flowTime = new Date(flow.millisecondsTimestamp || Date.now());

  const tr = container!.querySelector('tr')!;
  const tsLabel = tr.querySelector('td:nth-child(9)')!;

  // Just checks that tsLabel contains smth
  jest.advanceTimersByTime(0);
  expect(tsLabel.textContent).toContain(elapsedInWords(flowTime));

  jest.advanceTimersByTime(tsUpdateDelay / 2);
  expect(tsLabel.textContent).toContain(elapsedInWords(flowTime));
};

const runTest = (ntest: number, hf: HubbleFlow, exps: Expectations) => {
  const flow = new Flow(hf);
  const isSelected = [false, true];
  const ticker = new Ticker<TickerEvents>();

  ticker.start(TickerEvents.TimestampUpdate, DEFAULT_TS_UPDATE_DELAY);

  isSelected.forEach(selected => {
    const onSelect = jest.fn((f: Flow) => void 0);
    const selectedStr = selected ? 'selected' : 'not-selected';

    describe(`FlowsTable: Row (${selectedStr}) / test ${ntest}`, () => {
      let container: HTMLElement | null = null;

      beforeEach(() => {
        container = renderRow(
          <Row
            flow={flow}
            isVisibleColumn={() => true}
            selected={selected}
            onSelect={onSelect}
            ticker={ticker}
          ></Row>,
        );
      });

      test(`visual`, () => {
        runAppearanceTests(container!, exps, selected);
      });

      test(`temporal`, () => {
        runTemporalTests(container!, flow);
      });

      test(`interactions`, () => {
        runInteractionTests(container!, flow, onSelect);
      });
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

// TODO: test useFlowTimestamp
