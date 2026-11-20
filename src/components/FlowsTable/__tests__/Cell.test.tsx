import React from 'react';

import { Cell } from '~/components/FlowsTable/Cell';
import { Column } from '~/components/FlowsTable/general';

import { Flow } from '~/domain/flows';
import { HubbleFlow } from '~/domain/hubble';

import { data, render } from '~/testing';

const renderDstService = (overrides: Partial<HubbleFlow>) => {
  const flow = new Flow({ ...data.flows.hubbleOne, ...overrides });

  return render(<Cell flow={flow} kind={Column.DstService} />).container;
};

const markers = (container: HTMLElement) =>
  container.querySelectorAll('[role="img"][aria-label^="DNS record expired"]');

describe('FlowsTable Cell: destination service', () => {
  test('a current name is shown without a marker', () => {
    const container = renderDstService({
      destinationNamesList: ['current.example.com'],
      destinationNamesExpiredList: ['old.example.com'],
    });

    expect(container.textContent?.trim()).toBe('current.example.com');
    expect(markers(container).length).toBe(0);
  });

  test('an expired name is shown alone, with a marker and no subtitle', () => {
    const container = renderDstService({
      destinationNamesList: [],
      destinationNamesExpiredList: ['old.example.com', 'older.example.com'],
    });

    expect(container.textContent).toBe('old.example.com');
    expect(markers(container).length).toBe(1);
    expect(container.querySelector('.subtitle')).toBeNull();
  });

  test('without any name the identity is shown without a marker', () => {
    const container = renderDstService({
      destinationNamesList: [],
      destinationNamesExpiredList: [],
    });

    expect(markers(container).length).toBe(0);
  });
});
