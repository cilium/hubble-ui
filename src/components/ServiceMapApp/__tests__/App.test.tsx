import { act, React, render, waitFor } from '~/testing';
import { ServiceMapApp } from '~/components/ServiceMapApp';

jest.mock('~/api');

test('App renders without exceptions', () => {
  act(() => {
    render(<ServiceMapApp />);
  });
});
