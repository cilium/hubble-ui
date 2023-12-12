import { HubbleLink, Verdict, IPProtocol, AuthType, LinkThroughput } from '~/domain/hubble';

// NOTE: Link is restricted to only have information about which two services
// NOTE: is connected
export class Link {
  private ref: HubbleLink;
  public verdicts: Set<Verdict>;
  public authTypes: Set<AuthType>;
  public isEncrypted = false;

  constructor(ref: HubbleLink) {
    this.ref = ref;
    this.verdicts = new Set([ref.verdict]);
    this.authTypes = new Set([ref.authType]);
    this.isEncrypted = ref.isEncrypted;
  }

  public clone(): Link {
    const link = Link.fromHubbleLink(this.ref);
    link.verdicts = new Set(this.verdicts);
    link.authTypes = new Set(this.authTypes);

    return link;
  }

  public static fromHubbleLink(hl: HubbleLink): Link {
    return new Link(hl);
  }

  public updateWithHubbleLink(hl: HubbleLink): Link {
    const updated = this.clone();
    updated.verdicts.add(hl.verdict);
    updated.authTypes.add(hl.authType);

    // TODO: What should be performed here: accumulation or reassignment?
    updated.ref.bytesTransfered += hl.bytesTransfered;
    updated.ref.flowAmount += hl.flowAmount;

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

  public get isDNSRequest() {
    return this.ipProtocol === IPProtocol.UDP && this.destinationPort === 53;
  }

  public get throughput(): LinkThroughput {
    return {
      flowAmount: this.ref.flowAmount,
      latency: this.ref.latency,
      bytesTransfered: this.ref.bytesTransfered,
    };
  }
}
