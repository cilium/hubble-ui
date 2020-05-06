import { HubbleFlow } from '~/domain/flows';
import { Link, Service } from '~/domain/service-map';

export type ThrottledFlowsStream = IThrottledStream<Array<HubbleFlow>>;

export interface CoreAPIv1 {
  getFlowsStream: (params: { namespace: string }) => ThrottledFlowsStream;
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

export interface IThrottledStream<Data> extends IStream<Data> {
  throttleDelay: number;
}
