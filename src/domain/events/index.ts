import { HubbleLink, HubbleService } from '../hubble';
import { StateChange } from '../misc';
import { NamespaceDescriptor } from '../namespaces';

export interface NamespaceChange {
  namespace: NamespaceDescriptor;
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
