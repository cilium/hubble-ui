export const ids = {
  accessPoint: (cardId: string, port: number): string => {
    return `ap-${cardId}-${port}`;
  },
};
