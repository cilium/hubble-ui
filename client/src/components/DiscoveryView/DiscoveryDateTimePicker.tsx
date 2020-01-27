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
import { Button, Popover } from "@blueprintjs/core";
import { DatePicker } from "@blueprintjs/datetime";
import * as moment from "moment";
import * as React from "react";
import { provide } from "src/state";
import { DateTimeShortcuts } from "../Common/DateTimeShortcuts";
import { pushAppUrl } from "../Routing/state/actions";
import { getFlowsStartDateFromParams } from "../Routing/state/selectors";

const css = require("./DiscoveryDateTimePicker.scss");

const provider = provide({
  mapStateToProps: state => ({
    date: getFlowsStartDateFromParams(state)
  }),
  mapDispatchToProps: {
    pushAppUrl: pushAppUrl
  }
});

export const { Container: DiscoveryDateTimePicker } = provider(() => props => {
  const ref = React.createRef<DatePicker>();

  const onShortcutSelect = (date: moment.Moment) => {
    if (ref.current) {
      ref.current.setState({
        value: date.toDate()
      });
    }
  };

  return (
    <Popover
      autoFocus={false}
      content={
        <div className={css.wrapper}>
          <div className={css.shortcuts}>
            <DateTimeShortcuts
              onSelect={onShortcutSelect}
              startDateUrlParam="flowsStartDate"
              endDateUrlParam="flowsEndDate"
            />
          </div>
        </div>
      }
    >
      <Button small minimal={true} icon="time" text={props.date.label} />
    </Popover>
  );
});
