import { Position as BBPosition, ToasterPosition } from '@blueprintjs/core';

import { NotifierPosition } from '~/notifier/general';

export const position = (pos: NotifierPosition): ToasterPosition => {
  switch (pos) {
    case NotifierPosition.TopCenter:
      return BBPosition.TOP;
    case NotifierPosition.TopLeft:
      return BBPosition.TOP_LEFT;
    case NotifierPosition.TopRight:
      return BBPosition.TOP_RIGHT;
    case NotifierPosition.BottomCenter:
      return BBPosition.BOTTOM;
    case NotifierPosition.BottomLeft:
      return BBPosition.BOTTOM_LEFT;
    case NotifierPosition.BottomRight:
      return BBPosition.BOTTOM_RIGHT;
  }

  return BBPosition.TOP;
};
