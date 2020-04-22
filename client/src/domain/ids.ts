export const ids = {
  accessPoint: (cardId: any, port: any): string => {
    return `ap-${cardId}-${port}`;
  },
};
