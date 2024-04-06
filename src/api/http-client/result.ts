import _ from 'lodash';

import { camelCasify } from '~/domain/misc';
import { Result } from '~/utils';

export class HTTPResult<T = Blob> {
  public static from<T = Blob>(res: Response): HTTPResult<T> {
    return new HTTPResult(res);
  }

  private response: Response;
  private extractedData: T | null = null;

  constructor(response: Response) {
    this.response = response;
  }

  public toString(): string {
    return this.isConnectionError
      ? this.errorMessage
      : `HTTPResult(status code: ${this.status}, status: ${this.statusText})`;
  }

  public get isOk(): boolean {
    const status = this.status || 0;
    return status >= 200 && status < 300;
  }

  public get isError(): boolean {
    return !this.isOk;
  }

  public get isConnectionError(): boolean {
    return this.response.type === 'error';
  }

  public get errorMessage(): string {
    return this.isConnectionError ? 'Network error occured' : this.response.statusText;
  }

  public get headers(): Response['headers'] {
    return this.response.headers;
  }

  public get locationHeader(): string | null {
    return this.headers.get('Location') ?? this.headers.get('location');
  }

  public get status(): number | null {
    return this.response.status;
  }

  public get statusText(): string {
    return this.response.statusText;
  }

  public get data(): T | null {
    return this.extractedData || null;
  }

  public get isBadRequest(): boolean {
    return this.status === 400;
  }

  public get isUnauthorized(): boolean {
    return this.status === 401;
  }

  public get isForbidden(): boolean {
    return this.status === 403;
  }

  public get isNotFound(): boolean {
    return this.status === 404;
  }

  public get isLargeRequest(): boolean {
    return this.status === 413;
  }

  public get isCapacityLimitExceeded(): boolean {
    return this.isLargeRequest;
  }

  public get isServerError(): boolean {
    return this.status === 500;
  }

  public get isNotSupported(): boolean {
    return this.status === 501;
  }

  public get isServerOverloaded(): boolean {
    return this.status === 503;
  }

  public async arrayBuffer(): Promise<HTTPResult<ArrayBuffer>> {
    this.extractedData = (await this.response.arrayBuffer()) as any as T;
    return this as HTTPResult<ArrayBuffer>;
  }

  public async json(): Promise<HTTPResult<object>> {
    this.extractedData = (await this.response.json()) as any as T;
    this.extractedData = camelCasify(this.extractedData);
    return this as HTTPResult<object>;
  }

  public async blob(): Promise<HTTPResult<Blob>> {
    this.extractedData = (await this.response.blob()) as any as T;
    return this as HTTPResult<Blob>;
  }

  public result(): Result<T, HTTPResult<T>> {
    return this.isError ? Result.error(this) : Result.success(this.data!);
  }
}
