import { Status, Error as GRPCError } from 'grpc-web';

// TODO: abstract this status type
export type GeneralStreamEvents = {
  error: (_: GRPCError) => void;
  end: () => void;
  status: (status: Status) => void;
};
