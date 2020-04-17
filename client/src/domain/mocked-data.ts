import { Layer4 as L4 } from '~common/types/hubble/flow/flow_pb';

export type Layer4 = L4.AsObject;

export interface Flow {
  l4: Layer4;
  l7?: Layer7;

  source: IEndpoint;
  destination: IEndpoint;

  proc?: Array<Process>;
}

export interface DNS {
  query: string;
  rcode: string;
  ips: Array<string>;
}

export interface Layer7 {
  dns?: DNS;
}

export interface TCP {
  sourcePort: number;
  destinationPort: number;
}

export interface KV {
  key: string;
  value: string;
}

export interface Protocol {
  id: string;
  l4: string;
  l7: string | null;
  port: number;
  applicationProtocol: string | null;
  functions: Array<string>;
}

export interface IEndpoint {
  id: string;
  labels: Array<KV>;
  egressEnforcement: boolean;
  ingressEnforcement: boolean;
  visibilityPolicy: boolean;
}

export interface Process {
  bin: string;
  args: Array<string>;
}

export enum L34Protocol {
  ICMP = 1,
  UDP = 2,
  TCP = 3,
}
