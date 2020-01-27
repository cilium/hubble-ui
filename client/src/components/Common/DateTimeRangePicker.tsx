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
import {
  DateRangePicker,
  DateRange,
  TimePrecision
} from "@blueprintjs/datetime";

interface OwnProps {
  readonly innerRef?: React.RefObject<DateRangePicker>;
  readonly startDate: string;
  readonly endDate: string;
  readonly startDateUrlParam?: keyof UrlState;
  readonly endDateUrlParam?: string;
  readonly onChange?: (
    startDateTime: moment.Moment | undefined,
    endDateTime: moment.Moment | undefined
  ) => void;
}

const provider = provide({
  mapStateToProps: (state, ownProps: OwnProps) => ({}),
  mapDispatchToProps: {
    pushAppUrl: pushAppUrl
  }
});

export const { Container: DateTimeRangePicker } = provider(() => props => {
  const onChange = ([startDate, endDate]: DateRange) => {
    const startDateTime = startDate ? moment(startDate) : undefined;
    const endDateTime = endDate ? moment(endDate) : undefined;
    if (props.onChange) {
      props.onChange(startDateTime, endDateTime);
    }
    const urlState = {};
    if (props.startDateUrlParam) {
      urlState[props.startDateUrlParam] = startDateTime
        ? {
            url: startDateTime.toISOString(),
            label: moment(startDateTime).format("lll"),
            date: startDateTime.toISOString()
          }
        : undefined;
    }
    if (props.endDateUrlParam) {
      urlState[props.endDateUrlParam] = endDateTime
        ? {
            url: endDateTime.toISOString(),
            label: moment(endDateTime).format("lll"),
            date: endDateTime.toISOString()
          }
        : undefined;
    }
    if (Object.keys(urlState).length > 0) {
      props.pushAppUrl(urlState);
    }
  };

  return (
    <DateRangePicker
      {...(props.innerRef ? { ref: props.innerRef } : {})}
      shortcuts={false}
      allowSingleDayRange
      singleMonthOnly
      defaultValue={[
        moment(props.startDate).toDate(),
        moment(props.endDate).toDate()
      ]}
      onChange={onChange}
      timePrecision={TimePrecision.MINUTE}
      maxDate={moment().toDate()}
    />
  );
});
