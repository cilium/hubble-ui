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
import { css } from "linaria";
import { provide } from "src/state";
import { CiliumNetworkPolicy, PolicySpecs } from "src/graphqlTypes";
import SyntaxHighlighter from "react-syntax-highlighter";
import { Button } from "@blueprintjs/core";
import { downloadFile } from "../App/state/utils";
import { Icon } from "../Misc/SVGIcon";
import { isPolicySpecs } from "./state/utils";
import { DownloadPolicy } from "../TroubleshootingView/DownloadPolicy";

interface OwnProps {
  data: CiliumNetworkPolicy | PolicySpecs | null;
}

const provider = provide({
  mapStateToProps: (_state, _ownProps: OwnProps) => ({})
});

const container = css`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  padding: 11px 12px 12px 0;
`;
const scrollableYAML = css`
  max-width: 100%;
  width: 100%;
  flex: 1;
  overflow: hidden;

  pre {
    margin: 0;
    max-height: 100% !important;
    overflow: auto;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
`;
const yamlBlock = css`
  width: 100%;

  pre {
    width: 100%;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
`;
const specsWrapper = css`
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
`;
const policyName = css`
  font-size: 16px;
  font-weight: 600;
  color: #7b7b7b;
`;
const header = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex: 0 0 35px;
`;
const type = css`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

export const { Container: PolicyYAMLViewer } = provider(() => props => {
  const { data } = props;
  let content: React.ReactElement | null;

  if (!data) {
    return null;
  }

  if (isPolicySpecs(data)) {
    const p = data as PolicySpecs;
    content = (
      <>
        <div className={header}>
          <div className={policyName}>{p.policyName}</div>
          <DownloadPolicy name={p.policyName} namespace={p.policyName} />
        </div>
        <div className={specsWrapper}>
          <div className={type}>Ingress specs</div>
          {p.ingressSpecs.map(specs => (
            <div className={yamlBlock}>
              <SyntaxHighlighter
                language="yaml"
                showLineNumbers={true}
                lineNumberStyle={{ opacity: 0.3 }}
              >
                {specs}
              </SyntaxHighlighter>
            </div>
          ))}
          {p.egressSpecs.map(specs => (
            <div className={yamlBlock}>
              <div className={type}>Egress specs</div>
              <SyntaxHighlighter
                language="yaml"
                showLineNumbers={true}
                lineNumberStyle={{ opacity: 0.3 }}
              >
                {specs}
              </SyntaxHighlighter>
            </div>
          ))}
        </div>
      </>
    );
  } else {
    const p = data as CiliumNetworkPolicy;
    content = (
      <>
        <div className={header}>
          <div className={policyName}>{p.name}</div>
          <Button
            minimal
            text="Download"
            rightIcon={<Icon name="download" size={12} color="#5C7080" />}
            onClick={() => downloadFile(p.name, p.yaml, "yaml")}
          />
        </div>
        <div className={scrollableYAML}>
          <SyntaxHighlighter
            language="yaml"
            showLineNumbers={true}
            lineNumberStyle={{ opacity: 0.3 }}
          >
            {p.yaml}
          </SyntaxHighlighter>
        </div>{" "}
      </>
    );
  }

  return <div className={container}>{content}</div>;
});
