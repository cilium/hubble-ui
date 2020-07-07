import { HubbleLink, Verdict } from '~/domain/hubble';

export class Link {
  public verdicts: Set<Verdict> = new Set();

  constructor(private ref: HubbleLink) {}

  public clone(): Link {
    const link = Link.fromHubbleLink(this.ref);
    link.verdicts = new Set([...this.verdicts]);

    return link;
  }

  public static fromHubbleLink(hl: HubbleLink): Link {
    return new Link(hl);
  }

  public updateWithHubbleLink(hl: HubbleLink): Link {
    const updated = this.clone();
    updated.verdicts.add(hl.verdict);

    return updated;
  }

  public get hubbleLink(): HubbleLink {
    return this.ref;
  }

  public get id() {
    return this.ref.id;
  }

  public get destinationId() {
    return this.ref.destinationId;
  }

  public get sourceId() {
    return this.ref.sourceId;
  }

  public get ipProtocol() {
    return this.ref.ipProtocol;
  }

  public get destinationPort() {
    return this.ref.destinationPort;
  }
}
