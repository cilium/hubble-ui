import { IPProtocol } from '~/domain/hubble';

export const toString = (p: IPProtocol): string => {
  return (
    {
      [IPProtocol.TCP]: 'TCP',
      [IPProtocol.UDP]: 'UDP',
      [IPProtocol.ICMPv4]: 'ICMPv4',
      [IPProtocol.ICMPv6]: 'ICMPv6',
      [IPProtocol.Unknown]: 'Unknown protocol',
    }[p] || 'Unknown protocol'
  );
};
