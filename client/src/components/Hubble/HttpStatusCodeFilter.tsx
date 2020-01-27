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
import {
  Button,
  ButtonGroup,
  Icon,
  Intent,
  Popover,
  InputGroup,
  Classes
} from "@blueprintjs/core";
import * as React from "react";
import { provide } from "../../state";
import { pushAppUrl } from "../Routing/state/actions";
import { getFlowsHttpStatusCodeQueryParams } from "../Routing/state/selectors";

const css = require("./HttpStatusCodeFilter.scss");

interface OwnProps {
  targetClassName?: string;
}

const provider = provide({
  mapStateToProps: (state, ownProps: OwnProps) => ({
    httpStatus: getFlowsHttpStatusCodeQueryParams(state)
  }),
  mapDispatchToProps: {
    pushAppUrl: pushAppUrl
  }
});

export const { Container: HttpStatusCodeFilter } = provider(() => props => {
  const [value, setValue] = React.useState(props.httpStatus);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.trim();
    setValue(nextValue.length > 0 ? nextValue : null);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    props.pushAppUrl({
      flowsHttpStatusCode: value
    });
  };

  const onClear = () => {
    props.pushAppUrl({
      flowsHttpStatusCode: null
    });
  };

  const enabled = Boolean(props.httpStatus && props.httpStatus.length > 0);

  return (
    <Popover
      targetClassName={props.targetClassName}
      content={
        <div className={css.outer}>
          <form onSubmit={onSubmit} className={css.wrapper}>
            <InputGroup
              autoFocus
              type="text"
              value={value || ""}
              onChange={onChange}
              placeholder="HTTP Status Code"
            />
            {props.httpStatus !== value && (
              <Button type="submit" small onClick={onSubmit}>
                Filter
              </Button>
            )}
          </form>
          <small className={css.note}>
            <Icon icon="info-sign" iconSize={12} /> Show only flows which match
            <br />
            this HTTP status code prefix
            <br />
            (e.g. "404", "5+")
          </small>
        </div>
      }
    >
      <ButtonGroup>
        <Button
          small
          minimal
          text="HTTP Status"
          intent={enabled ? Intent.PRIMARY : Intent.NONE}
          rightIcon={enabled ? undefined : "chevron-down"}
        />
        {enabled && (
          <Button
            small
            minimal
            icon="small-cross"
            onClick={onClear}
            intent={enabled ? Intent.PRIMARY : Intent.NONE}
          />
        )}
      </ButtonGroup>
    </Popover>
  );
});
