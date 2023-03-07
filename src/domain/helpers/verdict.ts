import { Verdict as PBVerdict } from '~backend/proto/flow/flow_pb';
import { Verdict } from '~/domain/hubble';

export const verdictFromPb = (v: PBVerdict): Verdict => {
  let verdict = Verdict.Unknown;

  if (v === PBVerdict.FORWARDED) {
    verdict = Verdict.Forwarded;
  } else if (v === PBVerdict.DROPPED) {
    verdict = Verdict.Dropped;
  } else if (v === PBVerdict.AUDIT) {
    verdict = Verdict.Audit;
  }

  return verdict;
};

export const verdictToPb = (v: Verdict): PBVerdict => {
  let verdict = PBVerdict.VERDICT_UNKNOWN;

  if (v === Verdict.Forwarded) {
    verdict = PBVerdict.FORWARDED;
  } else if (v === Verdict.Dropped) {
    verdict = PBVerdict.DROPPED;
  } else if (v === Verdict.Audit) {
    verdict = PBVerdict.AUDIT;
  } else if (v === Verdict.Error) {
    verdict = PBVerdict.ERROR;
  }

  return verdict;
};

export const verdictFromStr = (v: string): Verdict => {
  if (!v) return Verdict.Unknown;
  v = v.toLowerCase();

  if (v.startsWith('forward')) return Verdict.Forwarded;
  if (v.startsWith('drop')) return Verdict.Dropped;
  if (v.startsWith('audit')) return Verdict.Audit;

  return Verdict.Unknown;
};

export const toString = (verdict: Verdict): string => {
  switch (verdict) {
    case Verdict.Forwarded:
      return 'forwarded';
    case Verdict.Dropped:
      return 'dropped';
    case Verdict.Audit:
      return 'audit';
    case Verdict.Unknown:
      return 'unknown';
  }

  return 'unhandled';
};
