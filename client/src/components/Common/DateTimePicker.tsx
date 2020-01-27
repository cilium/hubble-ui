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
import * as moment from "moment";
import { provide } from "src/state";
import { pushAppUrl } from "../Routing/state/actions";
import { UrlState } from "../Routing/state/types";
import { DatePicker, TimePrecision } from "@blueprintjs/datetime";

interface OwnProps {
  readonly innerRef?: React.RefObject<DatePicker>;
  readonly date: string;
  readonly dateUrlParam?: keyof UrlState;
  readonly onChange?: (dateTime: moment.Moment | undefined) => void;
}

const provider = provide({
  mapStateToProps: (state, ownProps: OwnProps) => ({}),
  mapDispatchToProps: {
    pushAppUrl: pushAppUrl
  }
});

export const { Container: DateTimePicker } = provider(() => props => {
  const onChange = (date: Date) => {
    const dateTime = date ? moment(date) : undefined;
    if (props.onChange) {
      props.onChange(dateTime);
    }
    const urlState = {};
    if (props.dateUrlParam) {
      urlState[props.dateUrlParam] = dateTime
        ? {
            url: dateTime.toISOString(),
            label: dateTime.toISOString(),
            date: dateTime.toISOString()
          }
        : undefined;
    }
    if (Object.keys(urlState).length > 0) {
      props.pushAppUrl(urlState);
    }
  };

  return (
    <DatePicker
      {...(props.innerRef ? { ref: props.innerRef } : {})}
      defaultValue={moment(props.date).toDate()}
      onChange={onChange}
      timePrecision={TimePrecision.MINUTE}
      maxDate={moment().toDate()}
    />
  );
});
