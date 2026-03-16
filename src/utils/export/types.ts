export interface ExportedConnection {
  source: {
    id: string;
    name: string;
    namespace: string | null;
  };
  destination: {
    id: string;
    name: string;
    namespace: string | null;
  };
  destinationPort: number;
  ipProtocol: string;
  verdicts: string[];
  authTypes: string[];
  isEncrypted: boolean;
  throughput: {
    flowAmount: number;
    latency: {
      min: number;
      max: number;
      avg: number;
    } | null;
    bytesTransfered: number;
  };
}

export interface ExportedServiceMap {
  exportedAt: string;
  connections: ExportedConnection[];
  summary: {
    totalConnections: number;
    totalServices: number;
  };
}
