import { GrpcError, GrpcStatus, StatusCode, GrpcMetadata } from './common';

// TODO: provide additional getters if needed
export class GrpcWrappedError implements Error {
  private err: GrpcError;

  public static new(err: GrpcError | GrpcWrappedError): GrpcWrappedError {
    if (err instanceof GrpcWrappedError) return err;

    return new GrpcWrappedError(err);
  }

  public static fromError(err?: Error | null): GrpcWrappedError | null {
    if (err == null) return null;
    if (err instanceof GrpcWrappedError) return err;

    const { code, message, metadata } = err as any;
    if (code != null && message != null && metadata != null) {
      return GrpcWrappedError.new({ code, message, metadata });
    }

    return null;
  }

  public static fromStatus(st?: GrpcStatus | null): GrpcWrappedError | null {
    if (st == null) return null;
    if (!GrpcWrappedError.isErrorStatus(st)) return null;

    // TODO: Error data can probably be inside st.metadata, check it
    return GrpcWrappedError.new({
      message: st.details,
      code: st.code,
      metadata: st.metadata,
    });
  }

  public static isErrorStatus(st: GrpcStatus): boolean {
    return st.code !== StatusCode.OK;
  }

  constructor(err: GrpcError) {
    this.err = err;
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

  public get metadata(): { [key: string]: string[] } {
    return this.err.metadata.headersMap;
  }

  // NOTE: combined getters
  public get isRecoverableError() {
    return this.isConnectionError || this.isDeadlineExceeded;
  }

  public get isConnectionError() {
    return (
      (this.isUnavailable || this.isUnknown || this.isCancelled) && !this.isRBACAuthorizationExpired
    );
  }

  // NOTE: fundamental getters
  public get isOk() {
    return this.code === StatusCode.OK;
  }

  public get isInvalidArgument() {
    return this.code === StatusCode.InvalidArgument;
  }

  public get isUnauthenticated() {
    return this.code === StatusCode.Unauthenticated;
  }

  public get isPermissionDenied() {
    return this.code === StatusCode.PermissionDenied;
  }

  public get isNotFound() {
    return this.code === StatusCode.NotFound;
  }

  public get isAborted() {
    return this.code === StatusCode.Aborted;
  }

  public get isFailedPrecondition() {
    return this.code === StatusCode.FailedPrecondition;
  }

  public get isResourceExhausted() {
    return this.code === StatusCode.ResourceExhausted;
  }

  public get isCancelled() {
    return this.code === StatusCode.Canceled;
  }

  public get isUnimplemented() {
    return this.code === StatusCode.Unimplemented;
  }

  public get isUnavailable() {
    return this.code === StatusCode.Unavailable;
  }

  public get isDeadlineExceeded() {
    return this.code === StatusCode.DeadlineExceeded;
  }

  public get isUnknown() {
    return this.code === StatusCode.Unknown;
  }

  // special kind of errors
  public get isRBACAuthorizationExpired() {
    return this.message === 'jwt' || this.isUnauthenticated;
  }
}
