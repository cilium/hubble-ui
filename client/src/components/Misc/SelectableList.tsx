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
import { Checkbox } from "@blueprintjs/core";

const css = require("./SelectableList.scss");
const icon = require("../assets/icons/crossed-out-circle.svg");

export interface SelectableListOption {
  label: string;
  value: string;
  addon?: string | JSX.Element | null;
  selectable?: boolean;
  preselected?: boolean;
  visible?: boolean;
}

interface Props {
  options: SelectableListOption[];
  onChange(values: string[]): void;
  radio?: boolean;
  createRef?: (value: any) => void;
}

interface State {
  value: string[];
}

export default class SelectableList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      value: SelectableList.getInitialValue(props)
    };
  }

  static getInitialValue = (props: Props) => {
    return props.options
      .filter(({ preselected }) => preselected)
      .map(({ value }) => value);
  };

  handleClick = (value: string) => {
    let nextValue: string[];

    if (this.props.radio) {
      nextValue = [value];
    } else {
      this.state.value.includes(value)
        ? (nextValue = this.state.value.filter(v => v !== value))
        : (nextValue = [...this.state.value, value]);
    }

    this.setState(
      {
        value: nextValue
      },
      this.handleStateChange
    );
  };

  handleStateChange = () => {
    this.props.onChange(this.state.value);
  };

  toggleSelection = () => {
    let value: string[] = [];

    if (this.state.value.length) {
      value = [];
    } else {
      value = this.props.options
        .filter(({ selectable = true }) => selectable)
        .map(({ value }) => value);
    }

    this.setState({ value }, this.handleStateChange);
  };

  updateValue = (value: string[]) => {
    this.setState({ value }, this.handleStateChange);
  };

  componentDidMount() {
    this.props.createRef && this.props.createRef(this);
    this.handleStateChange();
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.options.length !== this.props.options.length) {
      this.setState(
        { value: SelectableList.getInitialValue(nextProps) },
        this.handleStateChange
      );
    }
  }

  render() {
    const { options } = this.props;

    return options.length ? (
      <div className={css.container}>
        {options
          .filter(o => typeof o.visible === "undefined" || o.visible)
          .map(({ label, value, addon, selectable = true }) => (
            <div className={css.item}>
              <Checkbox
                label={label}
                onChange={() => this.handleClick(value)}
                checked={this.state.value.includes(value)}
                disabled={!selectable}
              />
              <span>{addon}</span>
            </div>
          ))}
      </div>
    ) : (
      <div className={css.noData}>
        <img className={css.icon} src={icon} alt="Select cluster" />
        No data
      </div>
    );
  }
}
