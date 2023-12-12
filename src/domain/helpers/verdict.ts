import _ from 'lodash';

import * as flowpb from '~backend/proto/flow/flow_pb';
import { Verdict } from '~/domain/hubble';

export const verdictFromPb = (v: flowpb.Verdict): Verdict => {
  switch (v) {
    case flowpb.Verdict.VERDICT_UNKNOWN:
      return Verdict.Unknown;
    case flowpb.Verdict.FORWARDED:
      return Verdict.Forwarded;
    case flowpb.Verdict.DROPPED:
      return Verdict.Dropped;
    case flowpb.Verdict.ERROR:
      return Verdict.Error;
    case flowpb.Verdict.AUDIT:
      return Verdict.Audit;
    case flowpb.Verdict.REDIRECTED:
      return Verdict.Redirected;
    case flowpb.Verdict.TRACED:
      return Verdict.Traced;
    case flowpb.Verdict.TRANSLATED:
      return Verdict.Translated;
    default:
      return Verdict.Unknown;
  }
};

export const verdictToPb = (v: Verdict): flowpb.Verdict => {
  switch (v) {
    case Verdict.Forwarded:
      return flowpb.Verdict.FORWARDED;
    case Verdict.Dropped:
      return flowpb.Verdict.DROPPED;
    case Verdict.Error:
      return flowpb.Verdict.ERROR;
    case Verdict.Audit:
      return flowpb.Verdict.AUDIT;
    case Verdict.Redirected:
      return flowpb.Verdict.REDIRECTED;
    case Verdict.Traced:
      return flowpb.Verdict.TRACED;
    case Verdict.Translated:
      return flowpb.Verdict.TRANSLATED;
    default:
      return flowpb.Verdict.VERDICT_UNKNOWN;
  }
};

export const parse = (v?: any): Verdict | null => {
  if (!v) return null;

  if (_.isNumber(v) || !Number.isNaN(+v)) return verdictFromNumber(+v);
  if (_.isString(v)) return verdictFromStr(v);

  return null;
};

export const parseMany = (
  v: string | number | null | IterableIterator<string | number | null>,
  sep = ',',
): Verdict[] => {
  if (v == null) return [];

  const iterable = _.isString(v) ? v.split(sep) : _.isNumber(v) ? [v] : v;
  const parsed: Verdict[] = [];

  for (const part of iterable) {
    const maybeVerdict = parse(part);
    if (maybeVerdict == null) continue;

    parsed.push(maybeVerdict);
  }

  return parsed;
};

export const parseManySet = (...args: Parameters<typeof parseMany>): Set<Verdict> => {
  return new Set(parseMany(...args));
};

export const verdictFromNumber = (num: number): Verdict | null => {
  switch (num) {
    case Verdict.Forwarded:
      return Verdict.Forwarded;
    case Verdict.Dropped:
      return Verdict.Dropped;
    case Verdict.Error:
      return Verdict.Error;
    case Verdict.Audit:
      return Verdict.Audit;
    case Verdict.Redirected:
      return Verdict.Redirected;
    case Verdict.Traced:
      return Verdict.Traced;
    case Verdict.Translated:
      return Verdict.Translated;
    case Verdict.Unknown:
      return Verdict.Unknown;
    default:
      return null;
  }
};

export const verdictFromStr = (v: string): Verdict | null => {
  if (!v) return null;
  v = v.toLowerCase();

  return v.startsWith('forward')
    ? Verdict.Forwarded
    : v.startsWith('drop')
      ? Verdict.Dropped
      : v.startsWith('err')
        ? Verdict.Error
        : v.startsWith('audit')
          ? Verdict.Audit
          : v.startsWith('redirect')
            ? Verdict.Redirected
            : v.startsWith('trace')
              ? Verdict.Traced
              : v.startsWith('translate')
                ? Verdict.Translated
                : v.startsWith('unknown')
                  ? Verdict.Unknown
                  : null;
};

export const join = (
  verdicts?: null | Iterable<Verdict | null | undefined> | ArrayLike<Verdict | null | undefined>,
  sep = ',',
): string => {
  return verdicts == null ? '' : Array.from(verdicts).join(sep);
};

export interface VerdictViewOptions {
  shorten?: boolean;
  capitalizeFirstLetter?: boolean;
}

export const toString = (verdict: Verdict, opts?: VerdictViewOptions): string => {
  let str: string = '';

  switch (verdict) {
    case Verdict.Forwarded:
      str = opts?.shorten ? 'forward' : 'forwarded';
      break;
    case Verdict.Dropped:
      str = opts?.shorten ? 'drop' : 'dropped';
      break;
    case Verdict.Error:
      str = opts?.shorten ? 'error' : 'error';
      break;
    case Verdict.Audit:
      str = opts?.shorten ? 'audit' : 'audit';
      break;
    case Verdict.Redirected:
      str = opts?.shorten ? 'redirect' : 'redirected';
      break;
    case Verdict.Traced:
      str = opts?.shorten ? 'trace' : 'traced';
      break;
    case Verdict.Translated:
      str = opts?.shorten ? 'translate' : 'translated';
      break;
    case Verdict.Unknown:
      str = 'unknown';
      break;
    default:
      str = '<invalid verdict>';
      break;
  }

  if (opts?.capitalizeFirstLetter) {
    str = str.charAt(0).toUpperCase() + str.slice(1);
  }

  return str;
};
