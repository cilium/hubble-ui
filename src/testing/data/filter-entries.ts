import { FilterEntry } from '~/domain/filtering';
import { ReservedLabel } from '~/domain/labels';

export const filterEntries = {
  fromLabelRegular: FilterEntry.parse(`from:label=k8s:k8s-app=regular-service`),
  toLabelRegular: FilterEntry.parse(`to:label=k8s:k8s-app=regular-service`),
  bothLabelRegular: FilterEntry.parse(`both:label=k8s:k8s-app=regular-service`),
  toDnsGoogle: FilterEntry.parse(`to:dns=www.google.com`),
  fromDnsGoogle: FilterEntry.parse(`from:dns=www.google.com`),
  bothDnsGoogle: FilterEntry.parse(`both:dns=www.google.com`),
  fromIpRandom: FilterEntry.parse(`from:ip=153.82.167.250`),
  toIpRandom: FilterEntry.parse(`to:ip=153.82.167.250`),
  bothIpRandom: FilterEntry.parse(`both:ip=153.82.167.250`),
  fromLabelWorld: FilterEntry.parse(`from:label=${ReservedLabel.World}`),
  toLabelWorld: FilterEntry.parse(`to:label=${ReservedLabel.World}`),
  bothLabelWorld: FilterEntry.parse(`both:label=${ReservedLabel.World}`),
};
