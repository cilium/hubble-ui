import urlParse from 'url-parse';
import * as mobx from 'mobx';

import { ParsedUrl } from '~/utils/url';
import { Method as HttpMethod, parseMethod } from '~/domain/http';
import * as l7helpers from '~/domain/helpers/l7';
import { Layer7, L7FlowType, DNS, HTTP, Kafka, HTTPHeader, L7Kind } from '~/domain/hubble';

export class WrappedLayer7 implements Layer7 {
  public ref: Layer7;

  constructor(l7: Layer7) {
    this.ref = l7;

    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  private memoKind: L7Kind | undefined;
  public get kind(): L7Kind {
    if (this.memoKind !== undefined) return this.memoKind;

    this.memoKind = l7helpers.getKind(this.ref);

    return this.memoKind;
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

  private memoHttp: WrappedHTTP | undefined;
  public get http(): WrappedHTTP | undefined {
    if (this.ref.http == null) return undefined;

    if (this.memoHttp !== undefined) return this.memoHttp;

    this.memoHttp = new WrappedHTTP(this.ref.http);

    return this.memoHttp;
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

  private memoMethod: HttpMethod | undefined;
  public get method(): HttpMethod {
    if (this.memoMethod !== undefined) return this.memoMethod;

    this.memoMethod = parseMethod(this.ref.method)!;

    return this.memoMethod;
  }

  public get url(): string {
    return this.ref.url;
  }

  private memoParsedUrl: ParsedUrl | undefined;
  public get parsedUrl(): ParsedUrl {
    if (this.memoParsedUrl !== undefined) return this.memoParsedUrl;

    this.memoParsedUrl = urlParse(this.ref.url);

    return this.memoParsedUrl;
  }

  public get protocol(): string {
    return this.ref.protocol;
  }

  public get headersList(): HTTPHeader[] {
    return this.ref.headersList;
  }
}
