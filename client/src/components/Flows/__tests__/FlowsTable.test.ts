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
import { Label } from "../../../graphqlTypes";
import { getFlowServiceSubtitle, getFlowServicetTitle } from "../state/utils";

describe("FlowsTable", () => {
  it("extract flow service title from labels", () => {
    const dropLabels = (labels: Label[], ...dropKeys: string[]) => {
      return labels.filter(({ key }) => !dropKeys.includes(key));
    };

    const LABELS = [
      {
        key: "k8s:io.kubernetes.pod.namespace",
        value: "covalent"
      },
      {
        key: "k8s:io.cilium.k8s.policy.cluster",
        value: "minikube"
      },
      {
        key: "k8s:io.cilium.k8s.policy.serviceaccount",
        value: "account"
      },
      {
        key: "k8s:k8s-app",
        value: "cassandra"
      },
      {
        key: "k8s:app",
        value: "cassandra"
      },
      {
        key: "k8s:foo",
        value: "bar"
      },
      {
        key: "k8s:reserved:ololo",
        value: "cassandra"
      },
      {
        key: "k8s:functionName",
        value: "cassandra"
      },
      {
        key: "k8s:key-name-part",
        value: "cassandra"
      },
      {
        key: "k8s:name",
        value: "cassandra"
      }
    ];

    let labels = LABELS.slice();
    expect(getFlowServicetTitle(labels, null, null, true)).toBe(
      "namespace=covalent"
    );

    expect(
      getFlowServicetTitle(
        [{ key: "reserved:world", value: "" }],
        "0.0.0.0",
        "google.com",
        false
      )
    ).toBe("google.com");

    expect(
      getFlowServicetTitle(
        [{ key: "reserved:world", value: "" }],
        "0.0.0.0",
        null,
        false
      )
    ).toBe("0.0.0.0");

    expect(getFlowServicetTitle(labels, null, null, false)).toBe(
      "reserved:ololo=cassandra"
    );
    labels = dropLabels(labels, "k8s:reserved:ololo");

    expect(getFlowServicetTitle(labels, null, null, false)).toBe(
      "app=cassandra"
    );
    labels = dropLabels(labels, "k8s:app");

    expect(getFlowServicetTitle(labels, null, null, false)).toBe(
      "name=cassandra"
    );
    labels = dropLabels(labels, "k8s:name");

    expect(getFlowServicetTitle(labels, null, null, false)).toBe(
      "functionname=cassandra"
    );
    labels = dropLabels(labels, "k8s:functionName");

    expect(getFlowServicetTitle(labels, null, null, false)).toBe(
      "k8s-app=cassandra"
    );
    labels = dropLabels(labels, "k8s:k8s-app");

    expect(getFlowServicetTitle(labels, null, null, false)).toBe(
      "key-name-part=cassandra"
    );
    labels = dropLabels(labels, "k8s:key-name-part");

    expect(getFlowServicetTitle(labels, null, null, false)).toBe("foo=bar");
    labels = dropLabels(labels, "k8s:foo");

    expect(getFlowServicetTitle(labels, null, null, false)).toBe("untitled");
  });

  it("extract flow service subtitle", () => {
    expect(
      getFlowServiceSubtitle(
        [
          {
            key: "k8s:version",
            value: "2"
          },
          {
            key: "k8s:reserved:world",
            value: ""
          }
        ],
        false
      )
    ).toBe(null);

    expect(
      getFlowServiceSubtitle(
        [
          {
            key: "k8s:version",
            value: "2"
          },
          {
            key: "k8s:io.kubernetes.pod.namespace",
            value: "covalent"
          },
          {
            key: "k8s:app",
            value: "cassandra"
          }
        ],
        false
      )
    ).toBe("covalent");

    expect(
      getFlowServiceSubtitle(
        [
          {
            key: "k8s:version",
            value: "2"
          },
          {
            key: "k8s:io.kubernetes.pod.namespace",
            value: "covalent"
          },
          {
            key: "k8s:app",
            value: "cassandra"
          }
        ],
        true
      )
    ).toBe(null);
  });
});
