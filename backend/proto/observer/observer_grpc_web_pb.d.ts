import * as grpcWeb from 'grpc-web';

import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as flow_flow_pb from '../flow/flow_pb';
import * as relay_relay_pb from '../relay/relay_pb';

import {
  GetAgentEventsRequest,
  GetAgentEventsResponse,
  GetDebugEventsRequest,
  GetDebugEventsResponse,
  GetFlowsRequest,
  GetFlowsResponse,
  GetNodesRequest,
  GetNodesResponse,
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

  getAgentEvents(
    request: GetAgentEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<GetAgentEventsResponse>;

  getDebugEvents(
    request: GetDebugEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<GetDebugEventsResponse>;

  getNodes(
    request: GetNodesRequest,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: GetNodesResponse) => void
  ): grpcWeb.ClientReadableStream<GetNodesResponse>;

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

  getAgentEvents(
    request: GetAgentEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<GetAgentEventsResponse>;

  getDebugEvents(
    request: GetDebugEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<GetDebugEventsResponse>;

  getNodes(
    request: GetNodesRequest,
    metadata?: grpcWeb.Metadata
  ): Promise<GetNodesResponse>;

  serverStatus(
    request: ServerStatusRequest,
    metadata?: grpcWeb.Metadata
  ): Promise<ServerStatusResponse>;

}

