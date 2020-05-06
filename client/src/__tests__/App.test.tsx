import { act, React, render } from '@test-utils';
import api from '~/api';
import { App } from '~/components/App';

jest.mock('~/api');

test('App renders without exceptions', async () => {
  await act(async () => {
    render(<App api={api} />);
  });
});