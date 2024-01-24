import { act, React, render, data, fireEvent } from '~/testing';
import { Row } from '~/components/FlowsTable/Row';
import { Column } from '~/components/FlowsTable';

import { Flow } from '~/domain/flows';
import { HubbleFlow } from '~/domain/hubble';
import { elapsedInWords } from '~/utils/time';

const tsUpdateDelay = 5000;

jest.useFakeTimers();

interface Expectations {
  sourceTitle: string;
  destTitle: string;
  destPort: number;
  verdict: string;
}

const renderRow = (row: React.ReactElement<any>): HTMLElement => {
  let container: HTMLElement;

  act(() => {
    container = render(<div>{row}</div>).container;
  });

  return container!.querySelector('.row')! as HTMLElement;
};

const runInteractionTests = (
  row: HTMLElement,
  flow: Flow,
  onSelect: jest.Mock<void>,
  selected: boolean,
) => {
  fireEvent.click(row);

  expect(onSelect.mock.calls.length).toBe(1);

  if (selected) {
    expect(onSelect.mock.calls[0][0]).toBeNull();
  } else {
    expect(onSelect.mock.calls[0][0]).toBe(flow);
  }
};

const runAppearanceTests = (row: HTMLElement, exps: Expectations, selected: boolean) => {
  const sourceTitle = row.querySelector('.cell:nth-child(3)')!;
  const destTitle = row.querySelector('.cell:nth-child(6)')!;
  const destPort = row.querySelector('.cell:nth-child(7)')!;
  const verdictLabel = row.querySelector('.cell:nth-child(9)')!;

  expect(sourceTitle.textContent!.trim()).toBe(exps.sourceTitle);
  expect(destTitle.textContent!.trim()).toBe(exps.destTitle);
  expect(destPort.textContent).toBe(String(exps.destPort));
  expect(verdictLabel.textContent).toBe(exps.verdict);

  if (selected) {
    expect(row.className).toContain('selected');
  } else {
    expect(row.className).not.toContain('selected');
  }
};

const runTemporalTests = (row: HTMLElement, flow: Flow) => {
  jest.clearAllTimers();
  const tsLabel = row.querySelector('.cell:nth-child(12)')!;

  // Just checks that tsLabel contains smth
  jest.advanceTimersByTime(0);
  expect(tsLabel.textContent).toBeTruthy();
};

const runTest = (ntest: number, hf: HubbleFlow, exps: Expectations) => {
  const flow = new Flow(hf);
  const isSelected = [false, true];

  isSelected.forEach(selected => {
    const onSelect = jest.fn((flow: Flow | null) => void 0);
    const selectedStr = selected ? 'selected' : 'not-selected';

    describe(`FlowsTable: Row (${selectedStr}) / test ${ntest}`, () => {
      let row: HTMLElement;

      beforeEach(() => {
        row = renderRow(
          <Row
            flow={flow}
            visibleColumns={new Set(Object.values(Column))}
            isSelected={selected}
            onSelect={onSelect}
          ></Row>,
        );
      });

      test(`visual`, () => {
        runAppearanceTests(row, exps, selected);
      });

      test(`temporal`, () => {
        runTemporalTests(row, flow);
      });

      test(`interactions`, () => {
        runInteractionTests(row, flow, onSelect, selected);
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
  destTitle: '— ReceiverNs',
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
