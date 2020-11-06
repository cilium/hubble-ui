export interface Status {
  nodes: NodeStatus[];
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
