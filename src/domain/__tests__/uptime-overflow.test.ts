import { ServerStatusResponse } from '~backend/proto/observer/observer_pb';

/** 120 days in nanoseconds (> Number.MAX_SAFE_INTEGER) */
const ONE_SECOND_NS = 1_000_000_000n;
const ONE_DAY_NS = 24n * 60n * 60n * ONE_SECOND_NS;
const UPTIME_120_DAYS = 120n * ONE_DAY_NS;

describe('protobuf uint64 uptimeNs bigint decoding', () => {
  it('decodes uptimeNs > Number.MAX_SAFE_INTEGER as bigint without throwing', () => {
    const msg = ServerStatusResponse.create({
      numFlows: 1n,
      maxFlows: 10n,
      seenFlows: 5_000_000n,
      uptimeNs: UPTIME_120_DAYS,
      unavailableNodes: [],
      version: 'test',
    });

    const bin = ServerStatusResponse.toBinary(msg);
    const decoded = ServerStatusResponse.fromBinary(bin);

    expect(typeof decoded.uptimeNs).toBe('bigint');
    expect(decoded.uptimeNs).toBe(UPTIME_120_DAYS);
  });
});
