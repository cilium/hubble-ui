import * as grpcWeb from 'grpc-web';

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as flow_flow_pb from '../flow/flow_pb';

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

}

export class UIPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; });

  getEvents(
    request: GetEventsRequest,
    metadata?: grpcWeb.Metadata
  ): grpcWeb.ClientReadableStream<GetEventsResponse>;

}

