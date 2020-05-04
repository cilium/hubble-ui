import { HubbleFlow } from '~/domain/flows';
import { Link, Service } from '~/domain/service-map';

export interface CoreAPIv1 {
  getFlowsStream: (params: { namespace: string }) => IStream<Array<HubbleFlow>>;
  getServices: () => Promise<Array<Service>>;
  getNamespaces: () => Promise<Array<string>>;
  getLinks: () => Promise<Array<Link>>;
}

export interface API {
  v1: CoreAPIv1;
}

export interface IStream<Data> {
  subscribe(callback: (data: Data) => void): () => void;
  stop(): void;
}
