import { HTTPClient } from '~/api/http-client';
import { Options as StreamOptions } from './stream';

export { Stream, Options as StreamOptions, Event as StreamEvent } from './stream';

export { Oneshot } from './oneshot';
export type { OneshotOptions } from './oneshot';

export { Message } from './message';
export { CustomError } from './errors';

export type Options = {
  baseURL: string;
  requestTimeout: number;
  cors: boolean;
  corsHeaders: string[];
  useJSON: boolean;
  headersMutator: (h: Headers) => void;
};

export class CustomProtocolAPI {
  protected http: HTTPClient;

  constructor(private opts: Options) {
    this.http = new HTTPClient({
      baseURL: opts.baseURL,
      cors: opts.cors,
      corsAdditionalHeaders: opts.corsHeaders,
      timeout: opts.requestTimeout,
      headersMutator: opts.headersMutator,
    });
  }

  protected streamOpts<O extends { route: string }>(opts: O): StreamOptions & O {
    return {
      httpClient: this.http,
      useJSON: this.opts.useJSON,
      reconnects: true,
      ...opts,
    };
  }
}
