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

const css = require("./Inputs.scss");

interface IInputWithLabelState {
  value: string;
}
interface IInputWithLabelProps {
  controlled: boolean;
  name: string;
  label: string;
  placeholder: string;
  value?: string;
  initialValue?: string;
  type?: string;
  onChange: (value: string) => void;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export class InputWithLabel extends React.Component<
  IInputWithLabelProps,
  IInputWithLabelState
> {
  private input: HTMLInputElement | null;

  constructor(props: IInputWithLabelProps) {
    super(props);

    const { initialValue = "" } = this.props;

    this.state = {
      value: initialValue
    };
  }

  onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (this.props.controlled) {
      this.setState({ value: event.target.value }, () =>
        this.props.onChange(this.state.value)
      );
    } else {
      this.props.onChange(event.target.value);
    }
  };

  render() {
    const { value: stateValue } = this.state;
    const {
      controlled,
      name,
      label,
      placeholder,
      className,
      labelClassName,
      inputClassName,
      value: propsValue,
      type = "text"
    } = this.props;

    const value = controlled ? stateValue : propsValue;

    return (
      <label htmlFor={name} className={`${css.inputWithLabel} ${className}`}>
        <span className={`${css.label} ${labelClassName}`}>{label}</span>
        <input
          id={name}
          ref={input => (this.input = input)}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={this.onChange}
          className={`${css.input} ${inputClassName}`}
        />
      </label>
    );
  }
}
