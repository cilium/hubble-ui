import { FlowsFilterEntry, HubbleFlow } from '~/domain/flows';
import { Verdict } from '~/domain/hubble';
import { Link, Service } from '~/domain/service-map';

export type ThrottledFlowsStream = IThrottledStream<Array<HubbleFlow>>;

export interface CoreAPIv1 {
  getFlowsStream: (params: FlowsStreamParams) => ThrottledFlowsStream;
  getServices: () => Promise<Array<Service>>;
  getNamespaces: () => Promise<Array<string>>;
  getLinks: () => Promise<Array<Link>>;
}

export interface FlowsStreamParams {
  namespace: string;
  verdict?: Verdict | null;
  httpStatus?: string | null;
  filters: FlowsFilterEntry[];
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
