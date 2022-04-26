import { Message as PBMessage } from 'google-protobuf';
import { RpcError, Status as GRPCStatus } from 'grpc-web';

export enum GeneralStreamEventKind {
  Data = 'data',
  Status = 'status',
  Error = 'error',
  End = 'end',
}

export type GeneralStreamEvents = {
  [GeneralStreamEventKind.Data]: (data: PBMessage) => void;
  [GeneralStreamEventKind.Status]: (status: GRPCStatus) => void;
  [GeneralStreamEventKind.Error]: (_: RpcError) => void;
  [GeneralStreamEventKind.End]: () => void;
};
