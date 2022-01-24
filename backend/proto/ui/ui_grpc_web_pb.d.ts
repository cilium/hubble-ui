import * as grpcWeb from 'grpc-web';

import * as ui_status_pb from '../ui/status_pb';
import * as ui_ui_pb from '../ui/ui_pb';


export class UIClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getEvents(
    request: ui_ui_pb.GetEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<ui_ui_pb.GetEventsResponse>;

  getStatus(
    request: ui_status_pb.GetStatusRequest,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: ui_status_pb.GetStatusResponse) => void
  ): grpcWeb.ClientReadableStream<ui_status_pb.GetStatusResponse>;

  getControlStream(
    request: ui_ui_pb.GetControlStreamRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<ui_ui_pb.GetControlStreamResponse>;

}

export class UIPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getEvents(
    request: ui_ui_pb.GetEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<ui_ui_pb.GetEventsResponse>;

  getStatus(
    request: ui_status_pb.GetStatusRequest,
    metadata?: grpcWeb.Metadata
  ): Promise<ui_status_pb.GetStatusResponse>;

  getControlStream(
    request: ui_ui_pb.GetControlStreamRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<ui_ui_pb.GetControlStreamResponse>;

}

