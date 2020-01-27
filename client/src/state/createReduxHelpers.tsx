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
import { ComponentType } from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router";
import { ActionCreatorsMapObject, bindActionCreators } from "redux";
import { RootState } from "./rootReducer";

export interface MapDispatchToProps<IDispatchProps, IOwnProps> {
  (dispatch: (...args: any[]) => any, ownProps?: IOwnProps): IDispatchProps;
}

export interface MapStateToProps<IStateProps, IOwnProps> {
  (state: RootState, ownProps?: IOwnProps): IStateProps;
}

export function createMapDispatchToProps<
  IDispatchProps extends ActionCreatorsMapObject,
  IOwnProps
>(
  actionCreators: IDispatchProps
): MapDispatchToProps<IDispatchProps, IOwnProps> {
  return (dispatch, ownProps?) => bindActionCreators(actionCreators, dispatch);
}

function emptyMapDispatchToProps(dispatch: (...args: any[]) => any) {
  return {};
}

type ISetState = (
  key: string,
  updateFn: any,
  callback?: (() => any) | undefined
) => any;

export function provide<
  StateProps = {},
  DispatchProps extends ActionCreatorsMapObject = {},
  OwnProps = {}
>(params: {
  mapStateToProps?: MapStateToProps<StateProps, OwnProps>;
  mapDispatchToProps?:
    | DispatchProps
    | MapDispatchToProps<DispatchProps, OwnProps>;
}) {
  if (!params.mapStateToProps && !params.mapDispatchToProps) {
    throw new Error(
      "At least mapStateToProps function or actionCreators object must be provided"
    );
  }

  const mapDispatchToProps = params.mapDispatchToProps
    ? params.mapDispatchToProps instanceof Function
      ? params.mapDispatchToProps
      : createMapDispatchToProps<DispatchProps, OwnProps>(
          params.mapDispatchToProps as DispatchProps
        )
    : emptyMapDispatchToProps;

  const hoc = params.mapStateToProps
    ? connect<StateProps, DispatchProps, OwnProps>(
        params.mapStateToProps,
        mapDispatchToProps as MapDispatchToProps<DispatchProps, OwnProps>
      )
    : connect<null, DispatchProps, OwnProps>(
        null,
        mapDispatchToProps as MapDispatchToProps<DispatchProps, OwnProps>
      );

  type Props = StateProps & DispatchProps & OwnProps;
  type Factory = (IProps: Props) => ComponentType<Props>;
  return (componentFactory: Factory) => {
    // Generate types by fake objects
    const IProps = {} as Props;
    const IStateProps = {} as StateProps;
    const IDispatchProps = {} as DispatchProps;
    const IOwnProps = {} as OwnProps;

    const Component = componentFactory(IProps);
    const Container = hoc(Component as any) as ComponentType<OwnProps>;

    return {
      Component,
      Container,
      IProps,
      IStateProps,
      IDispatchProps,
      IOwnProps
    };
  };
}

export function provideWithRouter<
  StateProps = {},
  DispatchProps extends ActionCreatorsMapObject = {},
  OwnProps = {}
>(params: {
  mapStateToProps?: MapStateToProps<StateProps, RouteComponentProps<OwnProps>>;
  mapDispatchToProps?:
    | DispatchProps
    | MapDispatchToProps<DispatchProps, RouteComponentProps<OwnProps>>;
}) {
  if (!params.mapStateToProps && !params.mapDispatchToProps) {
    throw new Error(
      "At least mapStateToProps function or actionCreators object must be provided"
    );
  }

  const mapDispatchToProps = params.mapDispatchToProps
    ? params.mapDispatchToProps instanceof Function
      ? params.mapDispatchToProps
      : createMapDispatchToProps<DispatchProps, RouteComponentProps<OwnProps>>(
          params.mapDispatchToProps as DispatchProps
        )
    : emptyMapDispatchToProps;

  const hoc = params.mapStateToProps
    ? connect<StateProps, DispatchProps, RouteComponentProps<OwnProps>>(
        params.mapStateToProps,
        mapDispatchToProps as MapDispatchToProps<
          DispatchProps,
          RouteComponentProps<OwnProps>
        >
      )
    : connect<null, DispatchProps, RouteComponentProps<OwnProps>>(
        null,
        mapDispatchToProps as MapDispatchToProps<
          DispatchProps,
          RouteComponentProps<OwnProps>
        >
      );

  type Props = StateProps & DispatchProps & RouteComponentProps<OwnProps>;
  type Factory = (IProps: Props) => ComponentType<Props>;
  return (componentFactory: Factory) => {
    // Generate types by fake objects
    const IProps = {} as Props;
    const IStateProps = {} as StateProps;
    const IDispatchProps = {} as DispatchProps;
    const IOwnProps = {} as RouteComponentProps<OwnProps>;

    const Component = componentFactory(IProps);
    const Container = withRouter(
      hoc(Component as any) as ComponentType<RouteComponentProps<OwnProps>>
    );

    return {
      Component,
      Container,
      IProps,
      IStateProps,
      IDispatchProps,
      IOwnProps
    };
  };
}
