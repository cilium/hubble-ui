import { Error as GrpcError, StatusCode } from 'grpc-web';

// TODO: provide additional getters if needed
export class GrpcWrappedError implements Error {
  private err: GrpcError;

  public static new(err: GrpcError | GrpcWrappedError): GrpcWrappedError {
    return new GrpcWrappedError(err);
  }

  constructor(err: GrpcError | GrpcWrappedError) {
    this.err = err;
    if (err instanceof GrpcWrappedError) return err;
  }

  public get code() {
    return this.err.code ?? null;
  }

  public get message() {
    return this.err.message;
  }

  public get name() {
    return GrpcWrappedError.name;
  }

  public get grpcError(): GrpcError {
    return this.err;
  }

  // NOTE: combined getters
  public get isConnectionError() {
    return this.isUnavailable || this.isUnknown;
  }

  // NOTE: fundamental getters
  public get isOk() {
    return this.code === StatusCode.OK;
  }

  public get isInvalidArgument() {
    return this.code === StatusCode.INVALID_ARGUMENT;
  }

  public get isUnauthenticated() {
    return this.code === StatusCode.UNAUTHENTICATED;
  }

  public get isPermissionDenied() {
    return this.code === StatusCode.PERMISSION_DENIED;
  }

  public get isNotFound() {
    return this.code === StatusCode.NOT_FOUND;
  }

  public get isAborted() {
    return this.code === StatusCode.ABORTED;
  }

  public get isFailedPrecondition() {
    return this.code === StatusCode.FAILED_PRECONDITION;
  }

  public get isResourceExhausted() {
    return this.code === StatusCode.RESOURCE_EXHAUSTED;
  }

  public get isCancelled() {
    return this.code === StatusCode.CANCELLED;
  }

  public get isUnimplemented() {
    return this.code === StatusCode.UNIMPLEMENTED;
  }

  public get isUnavailable() {
    return this.code === StatusCode.UNAVAILABLE;
  }

  public get isDeadlineExceeded() {
    return this.code === StatusCode.DEADLINE_EXCEEDED;
  }

  public get isUnknown() {
    return this.code === StatusCode.UNKNOWN;
  }
}
