import _ from 'lodash';

import { Option } from '~/utils';
import { HTTPResult } from './result';

export { HTTPResult } from './result';

export type Options = {
  baseURL: string;
  cors: boolean;
  corsAdditionalHeaders: string[];
  timeout?: number;
  headersMutator?: (h: Headers) => void;
};

export type RequestConfig = {
  timeout?: number;
  headers?: Record<string, string | number | boolean>;
  keepAlive?: boolean;
};

export class HTTPClient {
  private opts: Options;

  constructor(opts: Options) {
    this.opts = opts;
  }

  public get(path: string, cfg?: RequestConfig) {
    return this.buildRequest('GET', path, null, cfg);
  }

  public post(path: string, data: any, cfg?: RequestConfig) {
    return this.buildRequest('POST', path, data, cfg);
  }

  public put(path: string, data: any, cfg?: RequestConfig) {
    return this.buildRequest('PUT', path, data, cfg);
  }

  public delete(path: string, data: any, cfg?: RequestConfig) {
    return this.buildRequest('DELETE', path, data, cfg);
  }

  private buildRequest(
    method: string,
    path: string,
    data?: any,
    cfg?: RequestConfig,
  ): RepeatableRequest {
    const headers = new Headers();
    headers.append('origin', window.origin);

    if (this.opts.cors) {
      const reqHeaders = ['content-type', 'content-length', ...this.opts.corsAdditionalHeaders];
      headers.append('access-control-request-method', method);
      headers.append('access-control-request-headers', reqHeaders.join(','));
    }

    if (data != null) {
      this.getContentProps(data).some(([contentType, contentLength]) => {
        headers.append('content-type', contentType);
        headers.append('content-length', contentLength);
      });
    }

    const timeout = cfg?.timeout ?? this.opts.timeout;
    const url = this.buildUrl(path);

    this.opts.headersMutator?.(headers);

    return new RepeatableRequest((aborter: AbortController) => {
      const req = new Request(url, {
        method,
        body: data,
        mode: this.opts.cors ? 'cors' : 'same-origin',
        headers,
        signal: aborter.signal,
        credentials: this.opts.cors ? 'include' : 'same-origin',
        keepalive: !!cfg?.keepAlive,
      });

      if (timeout != null) {
        setTimeout(() => aborter.abort(), timeout);
      }

      return req;
    });
  }

  private getContentProps(data: any): Option<[string, string]> {
    if (data instanceof Uint8Array) {
      return Option.some(['application/octet-stream', `${data.length}`]);
    } else if (data instanceof ArrayBuffer) {
      return Option.some(['application/octet-stream', `${data.byteLength}`]);
    } else if (typeof Buffer !== 'undefined' && data instanceof Buffer) {
      return Option.some(['application/octet-stream', `${data.length}`]);
    } else if (_.isObject(data)) {
      const str = JSON.stringify(data);
      return Option.some(['application/json', `${str.length}`]);
    } else if (data instanceof FormData) {
      const msg = 'FormData payload is not supported yet';
      console.error(msg);

      throw new Error(msg);
    }

    const str = _.toString(data);
    return Option.some(['application/json', `${str.length}`]);
  }

  private buildUrl(path: string): string {
    const base = this.opts.baseURL;
    const ending = base.endsWith('/') ? '' : '/';
    const rest = path.startsWith('/') ? path.slice(1) : path;

    return `${this.opts.baseURL}${ending}${rest}`;
  }
}

export class RepeatableRequest {
  private aborter: AbortController | null = null;

  constructor(private reqBuilder: (abrt: AbortController) => Request) {}

  public async run(): Promise<HTTPResult> {
    const aborter = new AbortController();
    const req = this.reqBuilder(aborter);
    this.aborter = aborter;

    return fetch(req).then(resp => HTTPResult.from(resp));
  }

  public abort() {
    this.aborter?.abort();
    this.aborter = null;
  }
}
