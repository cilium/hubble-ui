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
import { Button, Classes, Dialog } from "@blueprintjs/core";
import * as React from "react";
import ReactDiffViewer from "react-diff-viewer";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

const css = require("./PolicyDiffViewer.scss");

export const PolicyViewerDiffModal: React.SFC<{
  yaml: string;
  previousYaml?: string;
  isOpen: boolean;
  onClose: () => void;
}> = props => {
  return (
    <Dialog
      className={css.wrapper}
      autoFocus
      enforceFocus
      canEscapeKeyClose
      canOutsideClickClose
      usePortal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Policy Viewer"
    >
      <div className={Classes.DIALOG_BODY}>
        <div className={css.content}>
          {props.previousYaml ? (
            <ReactDiffViewer
              oldValue={props.previousYaml}
              newValue={props.yaml}
              splitView={true}
            />
          ) : (
            <SyntaxHighlighter language="yaml">{props.yaml}</SyntaxHighlighter>
          )}
        </div>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <div>
            <Button onClick={props.onClose}>Close</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
