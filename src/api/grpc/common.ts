import { grpc } from '@improbable-eng/grpc-web';

export type GrpcMetadata = grpc.Metadata;
export const StatusCode = grpc.Code;

export type GrpcStatus = {
  details: string;
  code: grpc.Code;
  metadata: GrpcMetadata;
};

export type GrpcError = {
  message: string;
  code: number;
  metadata: grpc.Metadata;
};
