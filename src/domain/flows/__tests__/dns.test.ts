import { Flow } from '~/domain/flows';
import { flows } from '~/testing/data';

describe('Flow DNS matching', () => {
  test.each(['api.example.com', 'API.EXAMPLE.COM', 'Api.Example.COM'])(
    'matches source and destination DNS query %s',
    query => {
      const flow = new Flow({
        ...flows.hubbleOne,
        sourceNamesList: ['Api.Example.COM'],
        destinationNamesList: ['aPi.eXample.com'],
      });

      expect(flow.senderHasDomain(query)).toBe(true);
      expect(flow.receiverHasDomain(query)).toBe(true);
      expect(flow.senderHasDomain('other.example.com')).toBe(false);
      expect(flow.receiverHasDomain('other.example.com')).toBe(false);
      expect(flow.sourceNamesList).toEqual(['Api.Example.COM']);
      expect(flow.destinationNamesList).toEqual(['aPi.eXample.com']);
    },
  );

  test('does not match absent DNS names', () => {
    const flow = new Flow({ ...flows.hubbleOne, sourceNamesList: [], destinationNamesList: [] });
    expect(flow.senderHasDomain('api.example.com')).toBe(false);
    expect(flow.receiverHasDomain('api.example.com')).toBe(false);
  });
});
