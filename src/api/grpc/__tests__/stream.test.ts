import { GRPCStream, GRPCStreamEvent } from '../stream';
import { DumbResponseStream } from '~/testing/grpc/response-stream';
// import { GrpcWrappedError } from '../error';

describe('GRPCStream', () => {
  test('external data handler not dropped after reconnect', async () => {
    jest.setTimeout(5 * 1000 * 60);
    const TOTAL_RECONNECT_ERRORS = 3;
    let reconnectAttempt = 0;

    const streamFn = () => {
      const newStream = DumbResponseStream.new<number>();
      if (reconnectAttempt < TOTAL_RECONNECT_ERRORS) {
        reconnectAttempt += 1;

        setTimeout(() => {
          newStream.emit(GRPCStreamEvent.Error, new Error('ydz was here'));
        }, 100);
      } else {
        setTimeout(() => {
          newStream.emit(GRPCStreamEvent.Data, 41);
          newStream.emit(GRPCStreamEvent.Data, 42);
        }, 100);
      }

      return newStream;
    };

    const stream = new GRPCStream<number>(DumbResponseStream.new(), {
      streamFn,
    });
    const cb = jest.fn();

    stream.on(GRPCStreamEvent.Data, cb);

    stream.emit(GRPCStreamEvent.Data, 1);
    stream.emit(GRPCStreamEvent.Data, 2);

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
    expect(cb.mock.calls[2][0]).toBe(41);
    expect(cb.mock.calls[3][0]).toBe(42);
  });
});
