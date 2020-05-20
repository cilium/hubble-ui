import { act, React, render, waitFor } from '~/testing';
import { App } from '~/components/App';
import api from '~/api';

jest.mock('~/api');

test('App renders without exceptions', async () => {
  await act(async () => {
    render(<App api={api} />);
  });

  await waitFor(() => {
    const getEventStream = jest.spyOn(api.v1, 'getEventStream');
    expect(getEventStream).toHaveBeenCalled();
  });
});
