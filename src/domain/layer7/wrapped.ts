import urlParse from 'url-parse';
import * as mobx from 'mobx';

import { memoize } from '~/utils/memoize';
import { Method as HttpMethod, parseMethod } from '~/domain/http';
import * as l7helpers from '~/domain/helpers/l7';
import {
  Layer7,
  L7FlowType,
  DNS,
  HTTP,
  Kafka,
  HTTPHeader,
  L7Kind,
} from '~/domain/hubble';

export class WrappedLayer7 implements Layer7 {
  public ref: Layer7;

  constructor(l7: Layer7) {
    this.ref = l7;

    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  @memoize
  public get kind(): L7Kind {
    return l7helpers.getKind(this.ref);
  }

  public get type(): L7FlowType {
    return this.ref.type;
  }

  public get latencyNs(): number {
    return this.ref.latencyNs;
  }

  public get dns(): DNS | undefined {
    return this.ref.dns;
  }

  @memoize
  public get http(): WrappedHTTP | undefined {
    if (this.ref.http == null) return undefined;

    return new WrappedHTTP(this.ref.http);
  }

  public get kafka(): Kafka | undefined {
    return this.ref.kafka;
  }
}

export class WrappedHTTP implements HTTP {
  public ref: HTTP;

  constructor(ref: HTTP) {
    this.ref = ref;
  }

  public get code(): number {
    return this.ref.code;
  }

  @memoize
  public get method(): HttpMethod {
    return parseMethod(this.ref.method)!;
  }

  public get url(): string {
    return this.ref.url;
  }

  @memoize
  public get parsedUrl(): urlParse<string> {
    return urlParse(this.ref.url);
  }

  public get protocol(): string {
    return this.ref.protocol;
  }

  public get headersList(): HTTPHeader[] {
    return this.ref.headersList;
  }
}
