// Copyright 2019 Authors of Hubble
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import * as React from "react";
import { Icon } from "./Icon";

const css = require("./Buttons.scss");

export type ITextButtonProps = {
  id?: string;
  variant?: string;
  size?: "default" | "compact" | "big" | "small";
  muted?: boolean;
  outlined?: boolean;
  disabled?: boolean;
  onClick?: Function;
  style?: any;
  className?: string;
};

export type ITextIconButtonProps = ITextButtonProps & {
  icon: string;
  spin?: boolean;
};

export class TextButton extends React.PureComponent<ITextButtonProps, {}> {
  onClick = (event: any) => {
    if (this.props.onClick && !this.props.disabled) {
      this.props.onClick(event);
    }
  };

  render() {
    const {
      variant,
      size,
      muted,
      outlined,
      disabled,
      onClick,
      children,
      className,
      ...props
    } = this.props;

    const classes = [css.button];
    if (variant) classes.push(css[variant]);
    if (size) classes.push(css[size]);
    if (muted && !disabled) classes.push(css.muted);
    if (outlined) classes.push(css.outlined);
    if (className) classes.push(className);
    if (disabled) classes.push(css.disabled);

    if (disabled) {
      return (
        <button className={classes.join(" ")} {...props}>
          {children}
        </button>
      );
    }

    return (
      <button className={classes.join(" ")} onClick={this.onClick} {...props}>
        {children}
      </button>
    );
  }
}

export class TextIconButton extends React.PureComponent<
  ITextIconButtonProps,
  {}
> {
  render() {
    const { icon, spin = false, children, className, ...props } = this.props;

    let extraClassName = css["with-icon"];
    if (className) {
      extraClassName = `${extraClassName} ${className}`;
    }

    return (
      <TextButton className={extraClassName} {...props}>
        <Icon spin={spin} name={icon} className={css.icon} />
        {children}
      </TextButton>
    );
  }
}

export class IconButton extends React.PureComponent<ITextIconButtonProps, {}> {
  render() {
    const { icon, spin = false, children, className, ...props } = this.props;

    let extraClassName = css["only-icon"];
    if (className) {
      extraClassName = `${className} ${extraClassName}`;
    }

    return (
      <TextButton {...props} className={extraClassName}>
        <Icon spin={spin} name={icon} />
      </TextButton>
    );
  }
}
