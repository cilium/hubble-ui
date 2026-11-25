import React from 'react';
import { render, data } from '~/testing';
import { act } from '@testing-library/react';

import { Row } from '~/components/FlowsTable/Row';
import { Column } from '~/components/FlowsTable';

import { Flow } from '~/domain/flows';
import { HubbleFlow } from '~/domain/hubble';

const renderCell = (hf: HubbleFlow): string => {
  let container: HTMLElement;

  act(() => {
    container = render(
      <div>
        <Row
          flow={new Flow(hf)}
          visibleColumns={new Set([Column.Encrypted])}
          isSelected={false}
          onSelect={jest.fn()}
        />
      </div>,
    ).container;
  });

  return container!.querySelector('.row .cell')!.textContent!;
};

describe('FlowsTable: Encrypted column', () => {
  test('shows No for an unencrypted flow', () => {
    expect(renderCell(data.flows.hubbleOne)).toBe('No');
  });

  test('shows Yes for an encrypted flow', () => {
    const hf = { ...data.flows.hubbleOne, ip: { ...data.flows.hubbleOne.ip, encrypted: true } };
    expect(renderCell(hf as HubbleFlow)).toBe('Yes');
  });
});
