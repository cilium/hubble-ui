import * as cppb from '~backend/proto/customprotocol/customprotocol_pb';
import { StatusCode as GRPCStatusCode } from '~/api/grpc/common';

export class CustomError extends Error {
  constructor(
    public readonly kind: cppb.Error_Kind,
    public readonly code: number,
    public readonly message: string,
  ) {
    super(message);
  }

  public toString() {
    return this.isGRPC
      ? `Error (GRPC, ${GRPCStatusCode[this.code]}, ${this.code}): ${this.message}`
      : `Error (Custom, ${this.code}): ${this.message}`;
  }

  public get isRegular() {
    return this.kind === cppb.Error_Kind.Unknown;
  }

  public get isGRPC() {
    return this.kind === cppb.Error_Kind.Grpc;
  }

  public get isUnauthenticated() {
    return this.isGRPC && this.code === GRPCStatusCode.Unauthenticated;
  }

  public get isPermissionDenied() {
    return this.isGRPC && this.code === GRPCStatusCode.PermissionDenied;
  }

  public get isRbacNoRoles() {
    return this.isPermissionDenied && this.message === 'no roles';
  }
}
