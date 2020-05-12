import distanceInWords from 'date-fns/distance_in_words';

export const elapsedInWords = (t: Date, since: Date = new Date()): string => {
  return distanceInWords(since, t, {
    includeSeconds: true,
  });
};
