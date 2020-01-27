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

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  debounced?: number;
  handleChange?(value: string, event: React.ChangeEvent<HTMLInputElement>): any;
  [propName: string]: any;
}

interface State {
  readonly value: string | number | string[] | undefined;
}

export default class TextInput extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      value: props.value
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.value !== this.props.value) {
      this.setState({ value: nextProps.value });
    }
  }

  shouldComponentUpdate(nextProps: Props) {
    if (nextProps.value !== this.state.value) {
      return true;
    }

    return false;
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({ value: event.target.value });

    if (this.props.handleChange) {
      this.props.handleChange(event.target.value, event);
    }
  };

  render() {
    const { onChange, value, handleChange, ...restProps } = this.props;

    return (
      <input
        {...restProps}
        value={this.state.value}
        onChange={this.handleChange}
      />
    );
  }
}
