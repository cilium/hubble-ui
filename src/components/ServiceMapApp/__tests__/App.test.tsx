import { act, React, render, waitFor } from '~/testing';
import { ServiceMapApp } from '~/components/ServiceMapApp';

test('App renders without exceptions', () => {
  act(() => {
    render(<ServiceMapApp />);
  });
});
