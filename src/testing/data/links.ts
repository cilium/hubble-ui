import { AuthType, HubbleLink, IPProtocol, Verdict } from '~/domain/hubble';
import { Link } from '~/domain/link';

export const tcpForwarded: HubbleLink = {
  id: 'regular1-link-id',
  sourceId: 'src-123',
  destinationId: 'dst-456',
  destinationPort: 8080,
  ipProtocol: IPProtocol.TCP,
  verdict: Verdict.Forwarded,
  flowAmount: 2,
  bytesTransfered: 8192,
  latency: {
    min: { seconds: 0, nanos: 5e6 },
    max: { seconds: 0, nanos: 25e6 },
    avg: { seconds: 0, nanos: 15e6 },
  },
  authType: AuthType.Disbaled,
  isEncrypted: false,
};

export const tcpForwardedToItself: HubbleLink = {
  ...tcpForwarded,
  destinationId: tcpForwarded.sourceId,
};

export const tcpDroppedToItself: HubbleLink = {
  ...tcpForwardedToItself,
  verdict: Verdict.Dropped,
};

export const tcpDropped: HubbleLink = {
  ...tcpForwarded,
  verdict: Verdict.Dropped,
};

export const tcpUnknown: HubbleLink = {
  ...tcpForwarded,
  verdict: Verdict.Unknown,
};

export const tcpError: HubbleLink = {
  ...tcpForwarded,
  verdict: Verdict.Error,
};

export const udpForwarded: HubbleLink = {
  ...tcpForwarded,
  ipProtocol: IPProtocol.UDP,
};

export const udpDropped: HubbleLink = {
  ...udpForwarded,
  verdict: Verdict.Dropped,
};

export const udpUnknown: HubbleLink = {
  ...udpForwarded,
  verdict: Verdict.Unknown,
};

export const udpError: HubbleLink = {
  ...udpForwarded,
  verdict: Verdict.Error,
};

export const tcpForwardedDropped =
  Link.fromHubbleLink(tcpForwarded).updateWithHubbleLink(tcpDropped);

export const tcpMixed = tcpForwardedDropped
  .updateWithHubbleLink(tcpUnknown)
  .updateWithHubbleLink(tcpError);
