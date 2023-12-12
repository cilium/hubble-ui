import urlParse from 'url-parse';
import * as mobx from 'mobx';

import { PartialConnections, L7Endpoint } from '~/domain/interactions/new-connections';
import { L7Kind } from '~/domain/hubble';

export class HTTPEndpointGroup {
  public static createSorted(endpoints?: PartialConnections<L7Endpoint>): HTTPEndpointGroup[] {
    if (endpoints == null) return [];

    const pathGroups: Map<string, L7Endpoint[]> = new Map();
    const sortedEndpoints: L7Endpoint[] = [];

    endpoints?.get(L7Kind.HTTP)?.forEach(ep => {
      if (ep.ref.http == null) return;

      sortedEndpoints.push(ep);
    });

    // NOTE: sort all those endpoints by pathname
    sortedEndpoints.sort((a, b) => {
      const l = a.ref.http?.parsedUrl.pathname ?? '';
      const r = b.ref.http?.parsedUrl.pathname ?? '';

      return l.localeCompare(r);
    });

    const groups = sortedEndpoints.reduce((acc, ep) => {
      if (acc.length === 0) {
        const group = new HTTPEndpointGroup(ep.ref.http!.parsedUrl, [ep]);

        acc.push(group);
        return acc;
      }

      const lastGroup = acc[acc.length - 1];
      const currentUrl = ep.ref.http!.parsedUrl;

      if (lastGroup.key !== currentUrl.pathname) {
        acc.push(new HTTPEndpointGroup(currentUrl, [ep]));
      } else {
        lastGroup.addEndpoint(ep);
      }

      return acc;
    }, [] as HTTPEndpointGroup[]);

    return groups;
  }

  public url: urlParse<string>;
  public endpoints: L7Endpoint[];

  constructor(url: urlParse<string>, eps?: L7Endpoint[]) {
    this.url = url;
    this.endpoints = eps ?? [];

    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public addEndpoint(ep: L7Endpoint) {
    this.endpoints.push(ep);
  }

  public get key(): string {
    return this.url.pathname;
  }

  public get methods(): Set<string> {
    const s = new Set<string>();

    this.endpoints.forEach(ep => {
      if (ep.ref.http == null) return;

      s.add(ep.ref.http.method);
    });

    return s;
  }
}
