export const ids = {
  accessPoint: (cardId: string, port: number): string => {
    return `ap-${cardId}-${port}`;
  },
  cardConnector: (cardId: string, accessPointIds: IterableIterator<string> | string[]): string => {
    const accessPointsId = Array.from(accessPointIds).sort().join('/');

    return `cnctr-${cardId}-(${accessPointsId})`;
  },
};
