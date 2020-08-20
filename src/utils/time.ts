import distanceInWords from 'date-fns/formatDistance';

export const elapsedInWords = (t: Date, since: Date = new Date()): string => {
  return distanceInWords(since, t, {
    includeSeconds: true,
  });
};
