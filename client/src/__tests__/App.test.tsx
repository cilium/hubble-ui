import { act, React, render } from '@test-utils';
import api from '~/api/grpc';
import { App } from '~/components/App';

jest.mock('~/api/grpc');

test('App renders without exceptions', async () => {
  await act(async () => {
    render(<App api={api} />);
  });
});
