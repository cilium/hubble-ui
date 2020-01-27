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
import { ReactComponent } from "../../state";

const css = require("./Variants.scss");

export type IDefaultModalProp =
  | null
  | string
  | ReactComponent<any>
  | JSX.Element;
export interface IDefaultModal {
  readonly extraClassName?: string;
  readonly title?: IDefaultModalProp;
  readonly description?: IDefaultModalProp;
  readonly content?: IDefaultModalProp;
  readonly footer?: IDefaultModalProp;
}

const stopPropagation = (event: React.MouseEvent<HTMLDivElement>) =>
  event.stopPropagation();

export const DefaultModal = ({
  extraClassName,
  title,
  description,
  content,
  footer
}: IDefaultModal) => (
  <div className={`${css.wrapper} ${extraClassName}`} onClick={stopPropagation}>
    {title && <h3 className={css.title}>{title}</h3>}
    {description && <div className={css.description}>{description}</div>}
    {content && <div className={css.content}>{content}</div>}
    {footer && <div className={css.footer}>{footer}</div>}
  </div>
);
