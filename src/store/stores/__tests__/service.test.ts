import { ServiceStore } from '~/store/stores/service';
import { FilterEntry } from '~/domain/filtering';
import { services } from '~/testing/data';

describe('ServiceStore DNS lookup', () => {
  test('indexes and resolves mixed-case DNS names without changing display names or IDs', () => {
    const store = new ServiceStore();
    store.set([{ ...services.world, id: 'World-ID', dnsNames: ['Api.Example.COM'] }]);
    const card = store.cardsList[0];

    expect(store.cardsDomainMap.get('api.example.com')).toBe(card);
    expect(store.byFilterEntry(FilterEntry.newDNS('API.example.COM'))).toBe(card);
    expect(store.byFilterEntry(FilterEntry.newDNS('other.example.com'))).toBeUndefined();
    expect(card.domain).toBe('Api.Example.COM');
    expect(store.byId('World-ID')).toBe(card);
    expect(store.byId('world-id')).toBeUndefined();
  });

  test('keeps the first card when domain names differ only in case', () => {
    const store = new ServiceStore();
    store.set([
      { ...services.world, id: 'first', dnsNames: ['Api.Example.COM'] },
      { ...services.world, id: 'second', dnsNames: ['api.example.com'] },
    ]);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const map = store.cardsDomainMap;
      expect(map.size).toBe(1);
      expect(map.get('api.example.com')).toBe(store.cardsList[0]);
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  test('does not index cards without a DNS name', () => {
    const store = new ServiceStore();
    store.set([{ ...services.world, dnsNames: [] }]);
    expect(store.cardsDomainMap.size).toBe(0);
  });
});
