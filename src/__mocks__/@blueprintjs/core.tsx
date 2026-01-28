// Mock Blueprint's Icon component to avoid async loading in tests
import React from 'react';
import * as actualBlueprint from '@blueprintjs/core';

interface MockIconProps {
  icon?: string;
  size?: number;
  className?: string;
}

const MockIcon = React.forwardRef<HTMLSpanElement, MockIconProps>((props, ref) => {
  const { icon, className, ...rest } = props;
  return React.createElement('span', {
    ref,
    className: `bp5-icon ${className || ''}`,
    'data-icon': icon,
    ...rest,
  });
});

MockIcon.displayName = 'Icon';

module.exports = {
  ...actualBlueprint,
  Icon: MockIcon,
};
