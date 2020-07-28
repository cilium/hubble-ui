import * as grpcWeb from 'grpc-web';

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as flow_flow_pb from '../flow/flow_pb';
import * as relay_relay_pb from '../relay/relay_pb';

import {
  GetFlowsRequest,
  GetFlowsResponse,
  ServerStatusRequest,
  ServerStatusResponse} from './observer_pb';

export class ObserverClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  getFlows(
    request: GetFlowsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<GetFlowsResponse>;

  serverStatus(
    request: ServerStatusRequest,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: ServerStatusResponse) => void
  ): grpcWeb.ClientReadableStream<ServerStatusResponse>;

}

export class ObserverPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  getFlows(
    request: GetFlowsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<GetFlowsResponse>;

  serverStatus(
    request: ServerStatusRequest,
    metadata?: grpcWeb.Metadata
  ): Promise<ServerStatusResponse>;

}

