import { FilterEntry } from '~/domain/filtering';
import { ReservedLabel } from '~/domain/labels';

export const filterEntries = {
  fromLabelRegular: FilterEntry.parse(`from:label=k8s:k8s-app=regular-service`),
  toLabelRegular: FilterEntry.parse(`to:label=k8s:k8s-app=regular-service`),
  eitherLabelRegular: FilterEntry.parse(`either:label=k8s:k8s-app=regular-service`),
  toDnsGoogle: FilterEntry.parse(`to:dns=www.google.com`),
  fromDnsGoogle: FilterEntry.parse(`from:dns=www.google.com`),
  eitherDnsGoogle: FilterEntry.parse(`either:dns=www.google.com`),
  toDnsTwitterApi: FilterEntry.parse(`to:dns=api.twitter.com`),
  fromDnsTwitterApi: FilterEntry.parse(`from:dns=api.twitter.com`),
  eitherDnsTwitterApi: FilterEntry.parse(`either:dns=api.twitter.com`),
  fromIpRandom: FilterEntry.parse(`from:ip=153.82.167.250`),
  toIpRandom: FilterEntry.parse(`to:ip=153.82.167.250`),
  eitherIpRandom: FilterEntry.parse(`either:ip=153.82.167.250`),
  fromLabelWorld: FilterEntry.parse(`from:label=${ReservedLabel.World}`),
  toLabelWorld: FilterEntry.parse(`to:label=${ReservedLabel.World}`),
  eitherLabelWorld: FilterEntry.parse(`either:label=${ReservedLabel.World}`),
  fromPodCrawler: FilterEntry.parse(`from:pod=crawler-864b5f8656-np5jj`),
  toPodCrawler: FilterEntry.parse(`to:pod=crawler-864b5f8656-np5jj`),
  eitherPodCrawler: FilterEntry.parse(`either:pod=crawler-864b5f8656-np5jj`),
  fromRegularWorkload: FilterEntry.parse(`from:workload=sts/regular`),
  toRegularWorkload: FilterEntry.parse(`to:workload=sts/regular`),
  eitherRegularWorkload: FilterEntry.parse(`either:workload=sts/regular`),
};
