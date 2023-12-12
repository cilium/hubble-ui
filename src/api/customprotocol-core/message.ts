import * as pb from '~backend/proto/customprotocol/customprotocol_pb';
import { HTTPResult } from '~/api/http-client';

import { HTTPStatus } from '~/domain/http';
import { lowerSnakeCasify } from '~/domain/misc';
import * as bytes from '~/utils/bytes';
import { CustomError } from './errors';

export class Message {
  private static newProtoMessage(): pb.Message {
    return pb.Message.create({
      meta: pb.Meta.create(),
      body: pb.Body.create(),
    });
  }

  public static newFromHTTPResult(res: HTTPResult<ArrayBuffer>, inJSON?: boolean): Message {
    const buf = res.data || new ArrayBuffer(0);

    if (!inJSON) {
      const bytes = new Uint8Array(buf);
      const m = pb.Message.fromBinary(bytes);

      return new Message(m, res);
    }

    const m = pb.Message.fromJsonString(bytes.arrayBufferToString(buf));
    return new Message(m, res);
  }

  public static newMessage(route: string, traceId?: string): Message {
    const m = Message.newProtoMessage();
    if (m.meta != null) {
      pb.Meta.mergePartial(m.meta, {
        routeName: route,
        traceId,
      });
    }

    return new Message(m);
  }

  public static newPoll(route: string, traceId?: string): Message {
    const m = Message.newMessage(route, traceId);
    if (m.ref.meta != null) {
      pb.Meta.mergePartial(m.ref.meta, {
        isNotReady: true,
      });
    }

    return m;
  }

  private _errors: CustomError[] | null = null;

  constructor(
    private ref: pb.Message,
    private readonly httpResponse?: HTTPResult<ArrayBuffer>,
  ) {}

  public get httpStatus() {
    return this.httpResponse?.status;
  }

  public get isUnauthorized() {
    return this.httpStatus === HTTPStatus.Unauthorized;
  }

  public asBytes(): Uint8Array {
    return pb.Message.toBinary(this.ref);
  }

  // NOTE: Lower snake case must be used here, because by some reason protoc
  // serializes objects into json using this case ><
  public asLowerSnakeCaseJSON() {
    return JSON.stringify(lowerSnakeCasify(pb.Message.toJson(this.ref)));
  }

  public setChannelId(chId?: string): this {
    if (this.ref.meta != null) {
      pb.Meta.mergePartial(this.ref.meta, {
        channelId: chId || '',
      });
    }
    return this;
  }

  public setIsNotReady(nr?: boolean): this {
    if (this.ref.meta != null) {
      pb.Meta.mergePartial(this.ref.meta, {
        isNotReady: nr || false,
      });
    }
    return this;
  }

  public setTraceId(tId?: string): this {
    if (this.ref.meta != null) {
      pb.Meta.mergePartial(this.ref.meta, {
        traceId: tId || '',
      });
    }
    return this;
  }

  public setIsTerminated(isTerm?: boolean): this {
    if (this.ref.meta != null) {
      pb.Meta.mergePartial(this.ref.meta, {
        isTerminated: isTerm || false,
      });
    }
    return this;
  }

  public setRoute(r: string): this {
    if (this.ref.meta != null) {
      pb.Meta.mergePartial(this.ref.meta, {
        routeName: r,
      });
    }
    return this;
  }

  public setBodyBytes(b: Uint8Array | string): this {
    if (this.ref.body != null) {
      pb.Body.mergePartial(this.ref.body, {
        content: bytes.toUint8Array(b),
      });
    }
    return this;
  }

  public get channelId() {
    return this.ref.meta?.channelId || '';
  }

  public get pollDelay() {
    return this.ref.meta?.pollDelayMs || 0;
  }

  public get body() {
    return this.ref.body?.content || new Uint8Array();
  }

  public get hasPayload() {
    return this.body.length > 0;
  }

  public get isNotReady() {
    return !!this.ref.meta?.isNotReady;
  }

  public get isPollResponse() {
    return this.isNotReady;
  }

  public get isTerminated() {
    return !!this.ref.meta?.isTerminated;
  }

  public get isEmpty() {
    return !!this.ref.meta?.isEmpty;
  }

  public get isError() {
    return !!this.ref.meta?.isError;
  }

  public get errors(): CustomError[] {
    if (this._errors != null) return this._errors;

    const errs = this.ref.meta?.errors || [];
    this._errors = errs.map(err => new CustomError(err.kind, err.code, err.message));

    return this._errors;
  }
}
