import { GetEventsResponse } from '~backend/proto/ui/ui_pb';

import { GRPCStreamEvent } from '../stream';
import { DumbResponseStream } from '~/testing/grpc/response-stream';
import { EventStream } from '../event-stream';

describe('EventStream', () => {
  jest.setTimeout(5 * 1000 * 60);

  test('external data handler not dropped after reconnect', async () => {
    const TOTAL_RECONNECT_ERRORS = 3;
    let reconnectAttempt = 0;

    const responses = Array(4)
      .fill(null)
      .map(() => {
        return new GetEventsResponse();
      });

    const streamFn = () => {
      const newStream = DumbResponseStream.new<GetEventsResponse>();

      if (reconnectAttempt < TOTAL_RECONNECT_ERRORS) {
        reconnectAttempt += 1;

        setTimeout(() => {
          newStream.emit(GRPCStreamEvent.Error, new Error('ydz was here'));
        }, 100);
      } else {
        setTimeout(() => {
          newStream.emit(GRPCStreamEvent.Data, responses[2]);
          newStream.emit(GRPCStreamEvent.Data, responses[3]);
        }, 100);
      }

      return newStream;
    };

    const stream = new EventStream(DumbResponseStream.new(), void 0, {
      streamFn,
    });

    const cb = jest.fn();

    stream.on(GRPCStreamEvent.Data, cb);

    stream.emit(GRPCStreamEvent.Data, responses[0]);
    stream.emit(GRPCStreamEvent.Data, responses[1]);

    expect(cb.mock.calls.length).toBe(2);

    const reconnectingStarted = jest.fn();
    const reconnectingSuccess = jest.fn();
    const reconnectingFinished = jest.fn();
    const reconnectingFailed = jest.fn();

    stream.on(GRPCStreamEvent.ReconnectingStarted, reconnectingStarted);
    stream.on(GRPCStreamEvent.ReconnectingSuccess, reconnectingSuccess);
    stream.on(GRPCStreamEvent.ReconnectingFinished, reconnectingFinished);
    stream.on(GRPCStreamEvent.ReconnectingFailed, reconnectingFailed);

    await stream.reconnect();

    expect(reconnectingStarted.mock.calls.length).toBe(1);
    expect(reconnectingSuccess.mock.calls.length).toBe(1);
    expect(reconnectingFinished.mock.calls.length).toBe(1);
    expect(reconnectingFailed.mock.calls.length).toBe(TOTAL_RECONNECT_ERRORS);

    expect(cb.mock.calls.length).toBe(4);
    expect(cb.mock.calls[2][0]).toBe(responses[2]);
    expect(cb.mock.calls[3][0]).toBe(responses[3]);
  });
});
