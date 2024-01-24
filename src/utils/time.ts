import { formatDistance } from 'date-fns/formatDistance';

export const elapsedInWords = (t: Date, since: Date = new Date()): string => {
  return formatDistance(since, t, {
    includeSeconds: true,
  });
};
