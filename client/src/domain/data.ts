import {
  Layer4 as L4,
  ICMPv6,
  UDP,
  TCP,
} from '~common/types/hubble/flow/flow_pb';

import { Flow } from './mocked-data';

type Layer4 = L4.AsObject;

// TODO: add other
export { ICMPv6, UDP, TCP, Flow, Layer4 };
