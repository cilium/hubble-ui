import * as grpcWeb from 'grpc-web';

import * as observer_observer_pb from '../observer/observer_pb'; // proto import: "observer/observer.proto"


export class ObserverClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getFlows(
    request: observer_observer_pb.GetFlowsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<observer_observer_pb.GetFlowsResponse>;

  getAgentEvents(
    request: observer_observer_pb.GetAgentEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<observer_observer_pb.GetAgentEventsResponse>;

  getDebugEvents(
    request: observer_observer_pb.GetDebugEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<observer_observer_pb.GetDebugEventsResponse>;

  getNodes(
    request: observer_observer_pb.GetNodesRequest,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: observer_observer_pb.GetNodesResponse) => void
  ): grpcWeb.ClientReadableStream<observer_observer_pb.GetNodesResponse>;

  getNamespaces(
    request: observer_observer_pb.GetNamespacesRequest,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: observer_observer_pb.GetNamespacesResponse) => void
  ): grpcWeb.ClientReadableStream<observer_observer_pb.GetNamespacesResponse>;

  serverStatus(
    request: observer_observer_pb.ServerStatusRequest,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: observer_observer_pb.ServerStatusResponse) => void
  ): grpcWeb.ClientReadableStream<observer_observer_pb.ServerStatusResponse>;

}

export class ObserverPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getFlows(
    request: observer_observer_pb.GetFlowsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<observer_observer_pb.GetFlowsResponse>;

  getAgentEvents(
    request: observer_observer_pb.GetAgentEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<observer_observer_pb.GetAgentEventsResponse>;

  getDebugEvents(
    request: observer_observer_pb.GetDebugEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<observer_observer_pb.GetDebugEventsResponse>;

  getNodes(
    request: observer_observer_pb.GetNodesRequest,
    metadata?: grpcWeb.Metadata
  ): Promise<observer_observer_pb.GetNodesResponse>;

  getNamespaces(
    request: observer_observer_pb.GetNamespacesRequest,
    metadata?: grpcWeb.Metadata
  ): Promise<observer_observer_pb.GetNamespacesResponse>;

  serverStatus(
    request: observer_observer_pb.ServerStatusRequest,
    metadata?: grpcWeb.Metadata
  ): Promise<observer_observer_pb.ServerStatusResponse>;

}

