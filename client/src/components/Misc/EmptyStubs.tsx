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
import { provide } from "../../state";
import { showModal } from "../Modal/state/actions";
import { TextButton } from "./Buttons";

const css = require("./EmptyStubs.scss");

export const EmptyStub: React.SFC<{
  icon: string;
  iconWidth: number;
  iconHeight: number;
  title: string;
  description?: string;
  buttonLabel: string;
  buttonAction: () => void;
}> = ({
  icon,
  iconWidth,
  iconHeight,
  title,
  description,
  buttonAction,
  buttonLabel,
  children
}) => (
  <div className={css.wrapper}>
    <img
      src={icon}
      width={iconWidth}
      height={iconHeight}
      className={css.icon}
    />
    <div className={css.title}>{title}</div>
    {description && <div className={css.description}>{description}</div>}
    <TextButton variant="ok" onClick={buttonAction}>
      {buttonLabel}
    </TextButton>
    {children}
  </div>
);

const provider = provide({
  mapDispatchToProps: {
    showModal
  }
});

const clustersIcon = require("../assets/icons/icon-clusters.svg");
export const { Container: EmptyClustersStub } = provider(
  () => ({ showModal }) => {
    const [addClusterModalOpen, setAddClusterModalOpen] = React.useState<
      boolean
    >(false);
    return (
      <EmptyStub
        title="Time to add a cluster!"
        description="To get started with Isovalent Platform, you need to add at least one cluster"
        icon={clustersIcon}
        iconWidth={108}
        iconHeight={114}
        buttonLabel="Add Cluster"
        buttonAction={() => setAddClusterModalOpen(true)}
      ></EmptyStub>
    );
  }
);
