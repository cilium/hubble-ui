import { XY, WH } from './general';
import { Vec2 } from './vec2';
import { Line2 } from './line2';
import { XYWH } from './xywh';
import * as utils from './utils';

export { XY, WH, XYWH };
export { Vec2, Line2 };
export { utils };

export const dummy = {
  xy(x = 0, y = 0): XY {
    return { x, y };
  },
  xywh(x = 0, y = 0, w = 0, h = 0): XYWH {
    return XYWH.fromArgs(x, y, w, h);
  },
  vec2(x = 0, y = 0): Vec2 {
    return new Vec2(x, y);
  },
};
