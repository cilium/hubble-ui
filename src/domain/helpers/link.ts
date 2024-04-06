import { LinkThroughput } from '~/domain/hubble';

import * as time from './time';

export const zeroLinkThroughput = (): LinkThroughput => {
  return {
    bytesTransfered: 0,
    flowAmount: 0,
    latency: {
      min: time.zero(),
      max: time.zero(),
      avg: time.zero(),
    },
  };
};

export const reduceLinkThroughputs = (throughputs: LinkThroughput[]): LinkThroughput => {
  return throughputs.reduce((combined, throughput, idx) => {
    combined.bytesTransfered += throughput.bytesTransfered;
    combined.flowAmount += throughput.flowAmount;

    // NOTE: There is nothing to compare with on the first iteration
    if (idx === 0) {
      combined.latency = { ...throughput.latency };
      return combined;
    }

    combined.latency.min = time.getMin(combined.latency.min, throughput.latency.min);

    combined.latency.max = time.getMax(combined.latency.max, throughput.latency.max);

    combined.latency.avg = time.getAverage([combined.latency.avg, throughput.latency.avg])!;

    return combined;
  }, zeroLinkThroughput());
};

export const isDumbLinkThroughput = (tp: LinkThroughput | null): boolean => {
  return tp != null && tp.flowAmount <= 1 && tp.bytesTransfered <= 0;
};
