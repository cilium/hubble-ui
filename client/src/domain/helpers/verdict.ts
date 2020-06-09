import { Verdict as PBVerdict } from '~/proto/flow/flow_pb';
import { Verdict } from '~/domain/hubble';

export const verdictFromPb = (v: PBVerdict): Verdict => {
  let verdict = Verdict.Unknown;

  if (v === PBVerdict.FORWARDED) {
    verdict = Verdict.Forwarded;
  } else if (v === PBVerdict.DROPPED) {
    verdict = Verdict.Dropped;
  }

  return verdict;
};

export const verdictToPb = (v: Verdict): PBVerdict => {
  let verdict = PBVerdict.VERDICT_UNKNOWN;

  if (v === Verdict.Forwarded) {
    verdict = PBVerdict.FORWARDED;
  } else if (v === Verdict.Dropped) {
    verdict = PBVerdict.DROPPED;
  } else if (v === Verdict.Error) {
    verdict = PBVerdict.ERROR;
  }

  return verdict;
};
