// TODO: abstract this status type
export type GeneralStreamEvents = {
  error: (_: Error) => void;
  end: (_?: Error) => void;
  status: () => void;
};
