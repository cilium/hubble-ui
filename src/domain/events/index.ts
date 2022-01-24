import { HubbleLink, HubbleService } from '../hubble';
import { StateChange } from '../misc';

export interface NamespaceChange {
  namespace: string;
  change: StateChange;
}

export interface ServiceChange {
  service: HubbleService;
  change: StateChange;
}

export interface ServiceLinkChange {
  serviceLink: HubbleLink;
  change: StateChange;
}
