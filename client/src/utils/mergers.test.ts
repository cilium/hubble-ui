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
import { expect } from "chai";
import { ChangesMetaMap } from "../components/App/state/types";
import { AppEndpoint, Protocol } from "../graphqlTypes";
import { mergeEndpoints } from "./mergers";

const clone = <T>(data: T) => JSON.parse(JSON.stringify(data)) as T;
const createProtocol = (id: string): Protocol => ({
  id,
  allowedSources: [],
  allowedSourcesDisabled: [],
  l34Protocol: "TCP",
  functions: [],
  l7Protocol: null,
  applicationProtocol: null
});

describe("utils/mergers", () => {
  const stateEndpoints: AppEndpoint[] = [
    {
      id: "e1",
      name: "e1",
      icon: "http",
      disabled: false,
      labels: [],
      protocols: [createProtocol("p1")]
    }
  ];

  it("should merge added by user endpoint with actual endpoints from server (#1)", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    const newEndpoint: AppEndpoint = {
      id: "e2",
      name: "e2",
      icon: "http",
      disabled: false,
      labels: [],
      protocols: []
    };
    updatedStateEndpoints.push(newEndpoint);
    const changesMetaMap: ChangesMetaMap = { e2: "new" };
    const newEndpoints = clone(stateEndpoints);
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      changesMetaMap
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });

  it("should merge added by user endpoint with actual endpoints from server (#2)", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    const newFirstEndpoint: AppEndpoint = {
      id: "e2",
      name: "e2",
      icon: "http",
      disabled: false,
      labels: [],
      protocols: []
    };
    updatedStateEndpoints.push(newFirstEndpoint);
    const changesMetaMap: ChangesMetaMap = { e2: "new" };
    const newEndpoints = clone(stateEndpoints);
    const newSecondEndpoint: AppEndpoint = {
      id: "e3",
      name: "e3",
      icon: "http",
      disabled: false,
      labels: [],
      protocols: []
    };
    newEndpoints.push(newSecondEndpoint);
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      changesMetaMap
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    newStateEndpoints.splice(
      newStateEndpoints.length - 1,
      0,
      newSecondEndpoint
    );
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });

  it("should not reset changed by user endpoint `disabled` field", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    updatedStateEndpoints[0].disabled = true;
    const changesMetaMap: ChangesMetaMap = {
      e1: { disabled: true }
    };
    const newEndpoints = clone(stateEndpoints);
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      changesMetaMap
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });

  it("should not reset changed by user endpoint `icon` field", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    updatedStateEndpoints[0].icon = "emoji1";
    const changesMetaMap: ChangesMetaMap = {
      e1: { icon: "emoji1" }
    };
    const newEndpoints = clone(stateEndpoints);
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      changesMetaMap
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });

  it("should update not changed by user endpoint `disabled` field with actual changes from server", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    const newEndpoints = clone(stateEndpoints);
    newEndpoints[0].disabled = true;
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      {}
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    newStateEndpoints[0].disabled = true;
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });

  it("should update not changed by user endpoint `icon` field with actual changes from server", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    const newEndpoints = clone(stateEndpoints);
    newEndpoints[0].icon = "emoji1";
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      {}
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    newStateEndpoints[0].icon = "emoji1";
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });

  it("should merge added by user protocol with actual protocols from server", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    updatedStateEndpoints[0].protocols.push(createProtocol("p2"));
    const changesMetaMap: ChangesMetaMap = { p2: "new" };
    const newEndpoints = clone(stateEndpoints);
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      changesMetaMap
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });

  it("should merge added by user protocol with actual additional protocols from server", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    updatedStateEndpoints[0].protocols.push(createProtocol("p2"));
    const changesMetaMap: ChangesMetaMap = { p2: "new" };
    const newProtocol: Protocol = createProtocol("p3");
    const newEndpoints = clone(stateEndpoints);
    newEndpoints[0].protocols.push(newProtocol);
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      changesMetaMap
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    newStateEndpoints[0].protocols.splice(
      newStateEndpoints[0].protocols.length - 1,
      0,
      newProtocol
    );
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });

  it("should merge added by user protocol with actual deleted protocols from server", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    updatedStateEndpoints[0].protocols.push(createProtocol("p2"));
    const changesMetaMap: ChangesMetaMap = { p2: "new" };
    const newEndpoints = clone(stateEndpoints);
    newEndpoints[0].protocols.splice(0, 1);
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      changesMetaMap
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    newStateEndpoints[0].protocols.splice(0, 1);
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });

  it("should not reset changed by user `applicationProtocol` field", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    updatedStateEndpoints[0].protocols[0].applicationProtocol = "http";
    const changesMetaMap: ChangesMetaMap = {
      p1: { applicationProtocol: "http" }
    };
    const newEndpoints = clone(stateEndpoints);
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      changesMetaMap
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });

  it("should merge by user protocol changes with actual protocol changes from server", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    updatedStateEndpoints[0].protocols[0].applicationProtocol = "http";
    const changesMetaMap: ChangesMetaMap = {
      p1: { applicationProtocol: "http" }
    };
    const newEndpoints = clone(stateEndpoints);
    newEndpoints[0].protocols[0].l34Protocol = "UDP";
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      changesMetaMap
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    newStateEndpoints[0].protocols[0].l34Protocol = "UDP";
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });

  it("should merge added by user allowed sources to protocol with actual protocol allowed sources from server (#1)", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    const changesMetaMap: ChangesMetaMap = {
      p1: { allowedSources: ["e2", "e3"] }
    };
    const newEndpoints = clone(stateEndpoints);
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      changesMetaMap
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    newStateEndpoints[0].protocols[0].allowedSources.push("e2", "e3");
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });

  it("should merge added by user allowed sources to protocol with actual protocol allowed sources from server (#2)", () => {
    const updatedStateEndpoints = clone(stateEndpoints);
    const changesMetaMap: ChangesMetaMap = {
      p1: { allowedSources: ["e3"] }
    };
    const newEndpoints = clone(stateEndpoints);
    newEndpoints[0].protocols[0].allowedSources.push("e1");
    const mergedEndpoints = mergeEndpoints(
      updatedStateEndpoints,
      newEndpoints,
      {},
      changesMetaMap
    );
    const newStateEndpoints = clone(updatedStateEndpoints);
    newStateEndpoints[0].protocols[0].allowedSources.push("e1", "e3");
    expect(newStateEndpoints).to.deep.equal(mergedEndpoints);
  });
});
