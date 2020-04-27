import { IFlow } from '~/domain/flows';
import { Link, Service } from '~/domain/service-map';
import { EventEmitter } from '~/utils/emitter';

export interface CoreAPIv1 {
  getFlowsStream: () => APIStream<Array<IFlow>>;
  getServices: () => Promise<Array<Service>>;
  getNamespaces: () => Promise<Array<string>>;
  getLinks: () => Promise<Array<Link>>;
}

export interface API {
  v1: CoreAPIv1;
}

export interface APIStream<Data> extends EventEmitter {
  subscribe(callback: (data: Data) => void): () => void;
  stop(): void;
}
