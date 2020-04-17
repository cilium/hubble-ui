import * as React from 'react';
import { distBetweenPoints, putPointOnLine } from '../geometry';
import css from './LinkArrow.scss';

export interface Props {
  readonly srcX: number;
  readonly srcY: number;
  readonly dstX: number;
  readonly dstY: number;
}

export const LinkArrow = React.memo<Props>(props => {
  const dist = distBetweenPoints(
    props.srcX,
    props.srcY,
    props.dstX,
    props.dstY,
  );
  const { x, y, angle } = putPointOnLine(
    props.srcX,
    props.srcY,
    props.dstX,
    props.dstY,
    dist,
  );
  return (
    <g transform={`translate(${x},${y}) rotate(${angle}) translate(-6,-5.25)`}>
      <path
        d="M-7.38964445e-13,1.00023987 L-7.38964445e-13,9.46743092 L-7.39741601e-13,9.46743092 C-7.40655021e-13,10.0197157 0.44771525,10.4674309 1,10.4674309 C1.14538381,10.4674309 1.28901929,10.4357306 1.42089809,10.3745388 L10.5450261,6.14094332 L10.5450261,6.14094332 C11.046008,5.90848772 11.2636915,5.31391918 11.0312359,4.8129373 C10.9317327,4.59849068 10.7594727,4.4262307 10.5450261,4.32672746 L1.42089809,0.093131939 L1.42089809,0.093131939 C0.919916217,-0.139323659 0.325347669,0.0783598995 0.0928920708,0.579341775 C0.0317003019,0.711220583 -7.3898225e-13,0.854856057 -7.38964445e-13,1.00023987 Z"
        className={css.arrow}
        fill="none"
      />
    </g>
  );
});

LinkArrow.displayName = 'LinkArrow';
