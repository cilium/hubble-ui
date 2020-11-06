import * as grpcWeb from 'grpc-web';

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as flow_flow_pb from '../flow/flow_pb';
import * as ui_notifications_pb from '../ui/notifications_pb';
import * as ui_status_pb from '../ui/status_pb';

import {
  GetEventsRequest,
  GetEventsResponse} from './ui_pb';

export class UIClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  getEvents(
    request: GetEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<GetEventsResponse>;

  getStatus(
    request: ui_status_pb.GetStatusRequest,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: ui_status_pb.GetStatusResponse) => void
  ): grpcWeb.ClientReadableStream<ui_status_pb.GetStatusResponse>;

}

export class UIPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  getEvents(
    request: GetEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<GetEventsResponse>;

  getStatus(
    request: ui_status_pb.GetStatusRequest,
    metadata?: grpcWeb.Metadata
  ): Promise<ui_status_pb.GetStatusResponse>;

}

