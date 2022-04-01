import { sizes } from '~/ui';
import { Advancer } from '~/utils/advancer';

export type CardOffsets = {
  top: Advancer<string, number>;
  bottom: Advancer<string, number>;
  around: Advancer<string, number>;
};

export const createCardOffsetAdvancers = (): CardOffsets => {
  const overlapGap = sizes.arrowOverlapGap;

  return {
    top: Advancer.new<string, number>(overlapGap, overlapGap),
    bottom: Advancer.new<string, number>(overlapGap, overlapGap),
    around: Advancer.new<string, number>(overlapGap, sizes.aroundCardPadX),
  };
};
