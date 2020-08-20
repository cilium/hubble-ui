import { act, React, render, waitFor } from '~/testing';
import { App } from '~/components/App';
import api from '~/api';

jest.mock('~/api');

test('App renders without exceptions', () => {
  act(() => {
    render(<App api={api} />);
  });
});
