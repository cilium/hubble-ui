import { act, React, render } from '~/testing';
import { App } from '~/components/App';
import api from '~/api';

jest.mock('~/api');

test('App renders without exceptions', async () => {
  await act(async () => {
    render(<App api={api} />);
  });
});
