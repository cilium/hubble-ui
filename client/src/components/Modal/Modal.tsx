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
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { provide } from "../../state";
import "./Modal.global.scss";
import { hideModal } from "./state/actions";
import { getComponents } from "./state/selectors";

const css = require("./Modal.scss");

const provider = provide({
  mapStateToProps: state => ({
    components: getComponents(state)
  }),
  mapDispatchToProps: { hideModal }
});

export const {
  Component: ModalComponent,
  Container: ModalContainer
} = provider(
  Props =>
    class extends React.PureComponent<typeof Props, {}> {
      componentDidMount() {
        document.addEventListener("keydown", this.escapeListener);
      }

      componentWillUnmount() {
        document.removeEventListener("keydown", this.escapeListener);
      }

      escapeListener = (event: Event) => {
        if ((event as KeyboardEvent).keyCode == 27) {
          this.props.hideModal();
        }
      };

      render() {
        const { components, hideModal } = this.props;
        if (components.length === 0) {
          return <noscript />;
        }
        return (
          <TransitionGroup className={css.wrapper}>
            <CSSTransition classNames="modal" appear timeout={150}>
              <div className={css.wrapper} onClick={hideModal as any}>
                {components.map((component: any, idx: number) => (
                  <ComponentWrapper
                    key={idx}
                    component={component}
                    show={idx === components.length - 1}
                  />
                ))}
              </div>
            </CSSTransition>
          </TransitionGroup>
        );
      }
    }
);

const ComponentWrapper = React.memo<{ component: JSX.Element; show: boolean }>(
  props => {
    const className = [
      css.component,
      props.show ? css.visible : css.hidden
    ].join(" ");
    return <div className={className}>{props.component}></div>;
  }
);
