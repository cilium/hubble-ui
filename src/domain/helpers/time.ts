import { formatDate } from 'date-fns/format';

import { Timestamp as PBTimestamp } from 'google-protobuf/google/protobuf/timestamp_pb';
import gdurpb from 'google-protobuf/google/protobuf/duration_pb';
import * as durpb from '~backend/proto/google/protobuf/duration_pb';

import * as misc from '~/domain/misc';
import { Time } from '~/domain/hubble';
import { toCustomUnitsString } from '~/utils/numbers';

export { Time };

export const compareTimes = (lhs: Time | null, rhs: Time | null): number => {
  if (rhs == null || lhs == null) return 0;

  const { seconds: lseconds, nanos: lnanos } = lhs;
  const { seconds: rseconds, nanos: rnanos } = rhs;

  const lv = lseconds * 1e3 + lnanos / 1e6;
  const rv = rseconds * 1e3 + rnanos / 1e6;

  return lv - rv;
};

export const getMin = (a: Time, b: Time): Time => {
  return compareTimes(a, b) < 0 ? a : b;
};

export const getMax = (a: Time, b: Time): Time => {
  return compareTimes(a, b) < 0 ? b : a;
};

export const getAverage = (times: Time[]): Time | null => {
  if (times.length === 0) return null;

  return times.reduce((acc, t) => {
    const accMs = acc.seconds * 1e3 + acc.nanos / 1e6;
    const tMs = t.seconds * 1e3 + t.nanos / 1e6;

    const avg = (accMs + tMs) / 2;
    const avgSeconds = Math.floor(avg / 1e3);
    const avgNanos = Math.floor((avg - avgSeconds) * 1e6);

    return { seconds: avgSeconds, nanos: avgNanos };
  });
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

export const dateToPBTimestamp = (d: Date): PBTimestamp.AsObject => {
  return timeToPBTimestamp(dateToTime(d));
};

export const timeToPBTimestamp = (t: Time): PBTimestamp.AsObject => {
  const gts = new PBTimestamp();

  gts.setSeconds(t.seconds);
  gts.setNanos(t.nanos);

  return gts.toObject();
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

export const normalize = (t: Time): Time => {
  const seconds = t.seconds + (t.nanos >= 1e9 ? Math.floor(t.nanos / 1e9) : 0);
  const nanos = t.nanos >= 1e9 ? t.nanos % 1e9 : t.nanos;

  return { seconds, nanos };
};

export const toLatencyString = (t: Time, nFloatDigits = 2): string => {
  const normalized = normalize(t);
  if (isZero(normalized)) return '0 ns';

  const { seconds } = normalized;

  if (seconds >= 1) {
    const r = Math.pow(10, nFloatDigits);
    const seconds = normalized.seconds + normalized.nanos / 1e9;

    return (Math.round(seconds * r) / r).toFixed(nFloatDigits) + ' s';
  }

  return toCustomUnitsString(normalized.nanos, 1000, ['ns', 'µs', 'ms', 's'], 2);
};

export const fromDuration = (duration?: gdurpb.Duration | durpb.Duration | null): Time | null => {
  if (duration == null) return null;

  if (duration instanceof gdurpb.Duration) {
    return {
      seconds: duration.getSeconds(),
      nanos: duration.getNanos(),
    };
  }

  return {
    seconds: duration.seconds,
    nanos: duration.nanos,
  };
};

export const isZero = (t: Time): boolean => {
  return misc.tooSmall(t.seconds) && misc.tooSmall(t.nanos);
};

export const zero = (): Time => {
  return { seconds: 0, nanos: 0 };
};

export type UnifiedFormat = {
  date: string;
  time: string;
  zone: string;
  human: string;
};

export const unifiedFormatDate = (d: Date): UnifiedFormat => {
  const date = formatDate(d, 'yyyy/MM/dd');
  const time = formatDate(d, 'HH:mm:ss');
  const zone = formatDate(d, 'x');
  const human = `${date} ${time} (${zone})`;

  return { date, time, zone, human };
};

export const unifiedFormatTime = (d: Time): UnifiedFormat => {
  return unifiedFormatDate(timeToDate(d));
};
