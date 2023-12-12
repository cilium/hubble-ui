import { HubbleNode, HubbleServerStatus } from '~/domain/hubble';

export interface Status {
  nodes: HubbleNode[];
  status: HubbleServerStatus;
  versions: DeployedComponent[];
  flows: FlowStats;
}

export interface NodeStatus {
  name: string;
  isAvailable: boolean;
}

export interface DeployedComponent {
  name: string;
  version: string;
}

export interface FlowStats {
  perSecond: number;
}
