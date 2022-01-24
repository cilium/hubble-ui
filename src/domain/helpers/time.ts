import * as misc from '~/domain/misc';
import { Time } from '~/domain/hubble';
import { Timestamp as PBTimestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

export const compareTimes = (lhs: Time | null, rhs: Time | null): number => {
  if (rhs == null || lhs == null) return 0;

  const { seconds: lseconds, nanos: lnanos } = lhs;
  const { seconds: rseconds, nanos: rnanos } = rhs;

  const lv = lseconds * 1e3 + lnanos / 1e6;
  const rv = rseconds * 1e3 + rnanos / 1e6;

  return lv - rv;
};

export const dateToTime = (d: Date): Time => {
  const ms = +d;
  const seconds = Math.floor(ms / 1000);
  const nanos = (ms - seconds * 1000) * 1e6;

  return { seconds, nanos };
};

export const timeToDate = (t: Time): Date => {
  return new Date(t.seconds * 1000 + t.nanos / 1e9);
};

export const dateToPBTimestamp = (d: Date): PBTimestamp => {
  return timeToPBTimestamp(dateToTime(d));
};

export const timeToPBTimestamp = (t: Time): PBTimestamp => {
  const gts = new PBTimestamp();

  gts.setSeconds(t.seconds);
  gts.setNanos(t.nanos);

  return gts;
};

export const nowTime = (): Time => {
  return dateToTime(new Date());
};

export const parseTimeFromObject = (obj: any): Time | null => {
  if (obj == null) return null;

  if (obj.seconds != null && obj.nanos != null) {
    const seconds = parseInt(obj.seconds);
    const nanos = parseInt(obj.nanos);

    if (Number.isNaN(seconds) || !Number.isFinite(seconds)) return null;
    if (Number.isNaN(nanos) || !Number.isFinite(nanos)) return null;

    return { seconds, nanos };
  }

  if (obj.time != null) {
    const date = new Date(obj.time);
    if (!misc.isValidDate(date)) return null;

    return dateToTime(date);
  }

  const date = new Date(obj);
  if (!misc.isValidDate(date)) return null;
  return dateToTime(date);
};
