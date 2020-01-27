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
import { Menu, MenuItem } from "@blueprintjs/core";
import { css } from "linaria";
import * as moment from "moment";
import * as React from "react";
import { provide } from "src/state";
import { pushAppUrl } from "../Routing/state/actions";
import {
  getFlowsEndDateFromParams,
  getFlowsStartDateFromParams
} from "../Routing/state/selectors";
import { UrlState } from "../Routing/state/types";

const wrapper = css`
  width: 140px;
  min-width: 140px;
`;

interface ShortcutItem {
  readonly value: number;
  readonly unit: moment.unitOfTime.DurationConstructor;
  readonly label: string;
}

interface OwnProps {
  readonly startDateUrlParam?: keyof UrlState;
  readonly endDateUrlParam?: string;
  readonly onSelect?: (
    startDate: moment.Moment,
    endDate: moment.Moment
  ) => void;
  readonly shortcutsList?: Array<ShortcutItem>;
}

const defaultShortcutsList: Array<ShortcutItem> = [
  {
    value: 5,
    unit: "minutes",
    label: "Last 5 mins"
  },
  {
    value: 30,
    unit: "minutes",
    label: "Last 30 mins"
  },
  {
    value: 1,
    unit: "hour",
    label: "Last hour"
  },
  {
    value: 1,
    unit: "day",
    label: "Last day"
  },
  {
    value: 1,
    unit: "week",
    label: "Last week"
  },
  {
    value: 1,
    unit: "month",
    label: "Last month"
  }
];

const provider = provide({
  mapStateToProps: (state, ownProps: OwnProps) => {
    let startDate:
      | {
          url: string;
          label: string;
        }
      | undefined;
    let endDate:
      | {
          url: string;
          label: string;
        }
      | undefined;

    switch (ownProps.startDateUrlParam) {
      case "flowsStartDate":
        startDate = getFlowsStartDateFromParams(state);
        endDate = getFlowsEndDateFromParams(state);
        break;
    }

    return {
      startDate,
      endDate
    };
  },
  mapDispatchToProps: {
    pushAppUrl: pushAppUrl
  }
});

export const { Container: DateTimeShortcuts } = provider(() => props => {
  const { shortcutsList = defaultShortcutsList } = props;

  const onSelect = (value: number, metric: moment.DurationInputArg2) => {
    const startDate = moment().subtract(value, metric);
    const endDate = moment();
    if (props.onSelect) {
      props.onSelect(startDate, endDate);
    }
    const urlState = {};
    if (props.startDateUrlParam) {
      urlState[props.startDateUrlParam] = {
        url: `${value} ${metric}`,
        label: `${value} ${metric}`,
        date: startDate.toISOString()
      };
    }
    if (props.endDateUrlParam) {
      urlState[props.endDateUrlParam] = {
        url: "now",
        label: "now",
        date: endDate.toISOString()
      };
    }
    if (Object.keys(urlState).length > 0) {
      props.pushAppUrl(urlState);
    }
  };

  const getIsItemActive = (label: string): boolean => {
    if (props.startDate && props.endDate) {
      return props.endDate.label === "now"
        ? props.startDate.label === label
        : false;
    }

    return false;
  };

  return (
    <Menu className={wrapper}>
      {shortcutsList.map(shortcutItem => {
        return (
          <MenuItem
            key={shortcutItem.label}
            active={getIsItemActive(
              `${shortcutItem.value} ${shortcutItem.unit}`
            )}
            onClick={() => onSelect(shortcutItem.value, shortcutItem.unit)}
            text={shortcutItem.label}
          />
        );
      })}
    </Menu>
  );
});
