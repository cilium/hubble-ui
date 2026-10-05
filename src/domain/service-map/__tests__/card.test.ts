import { ServiceCard } from '~/domain/service-map';
import { services } from '~/testing/data';

describe('ServiceCard', () => {
  describe('world card with DNS names', () => {
    const card = ServiceCard.fromService({
      ...services.worldIPv4,
      identity: 9,
      dnsNames: ['api.example.com', 'cdn.example.com'],
    });

    test('is captioned by its reserved label, not by a peer domain', () => {
      expect(card.caption).toBe('world-ipv4');
    });

    // A world card stands for every external peer of its identity, so it must
    // match all of their flows, not one peer's.
    test('matches every flow of its identity', () => {
      expect(card.filterEntries.find(e => e.isIdentity)?.query).toBe('9');
    });

    // Filter entries are OR'd, so a per-domain entry could only ever restate
    // part of what the identity entry already matches -- while reading in the
    // search bar as though the card were scoped to that one domain.
    test('emits no DNS filter narrowing it to a single peer', () => {
      expect(card.filterEntries.find(e => e.isDNS)).toBeUndefined();
    });
  });
});
