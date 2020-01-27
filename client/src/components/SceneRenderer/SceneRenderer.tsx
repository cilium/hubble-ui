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
import { initial } from "lodash";
import * as React from "react";
import { Transition } from "react-spring";
import { Icon } from "../Misc/SVGIcon";

const css = require("./SceneRenderer.scss");

export interface IState {
  readonly currentSceneIndex: number;
  readonly transitioning: boolean;
  readonly scenes: JSX.Element[];
  readonly sceneData: {
    readonly [propName: string]: any;
  };
}

export interface ISceneProps {
  index: number;
  transitioning: boolean;
  sceneData: {
    [key: string]: any;
  };
  sceneActions: {
    updateData(nextData: { [key: string]: any }): void;
    toggleOverlay(): void;
    push(scene: JSX.Element): void;
    pop(): void;
  };
}

interface Scene extends ISceneProps {
  index: number;
}

interface IProps {
  readonly initialScene: JSX.Element;
  readonly animationType?: "slide" | "fade";
}

class SceneRenderer extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      currentSceneIndex: 0,
      transitioning: false,
      sceneData: {},
      scenes: [props.initialScene]
    };
  }

  updateData = (nextData: { [key: string]: any }) => {
    this.setState({ sceneData: { ...this.state.sceneData, ...nextData } });
  };

  toggleOverlay = () =>
    this.setState({ transitioning: !this.state.transitioning });

  push = (scene: JSX.Element) => {
    this.setState({
      scenes: [...this.state.scenes, scene]
    });
  };

  pop = () => {
    this.setState({ scenes: initial(this.state.scenes) });
  };

  getTransitionConfig = () => {
    const { scenes } = this.state;
    const animationType = this.props.animationType || "slide";
    const isFading = animationType === "fade";

    return {
      initial: {
        width: "100%",
        opacity: 1,
        transform: isFading ? "none" : "translate3d(0,0,0)"
      },
      from: {
        width: "100%",
        opacity: 0,
        transform: isFading ? "none" : "translate3d(500px,0,0)"
      },
      enter: {
        width: "100%",
        opacity: 1,
        transform: isFading ? "none" : "translate3d(0,0,0)"
      },
      leave: {
        width: "100%",
        opacity: 0,
        transform: isFading ? "none" : "translate3d(500px,0,0)",
        left: isFading ? 0 : 20,
        top: isFading ? 0 : 20,
        position: "absolute",
        zIndex: -1
      },
      update: (scene: Scene): any => {
        return {
          position: scene.index === scenes.length - 1 ? "static" : "absolute",
          zIndex: scene.index === scenes.length - 1 ? 1 : -1,
          left: isFading ? 0 : 0,
          top: isFading ? 0 : 20,
          width: "100%",
          opacity: scene.index === scenes.length - 1 ? 1 : 0,
          transform:
            scene.index === scenes.length - 1
              ? isFading
                ? "none"
                : "translate3d(0,0,0)"
              : isFading
              ? "none"
              : "translate3d(-500px,0,0)"
        };
      }
    };
  };

  render() {
    const { sceneData, transitioning, scenes } = this.state;

    return (
      <div className={css.container}>
        <Transition
          items={scenes.map((scene, index) => ({ ...scene, index }))}
          keys={(scene: Scene) => scene.index}
          {...this.getTransitionConfig()}
        >
          {(scene: any) => (styles: any) => {
            return (
              <div style={styles}>
                {React.cloneElement(scene, {
                  sceneActions: {
                    updateData: this.updateData,
                    toggleOverlay: this.toggleOverlay,
                    push: this.push,
                    pop: this.pop
                  },
                  sceneData
                })}
              </div>
            );
          }}
        </Transition>

        {transitioning && (
          <div className={css.loadingPlaceholder}>
            <Icon name="spinner" size={66} color="#08A6FF" animated={true} />
          </div>
        )}
      </div>
    );
  }
}

export default SceneRenderer;
