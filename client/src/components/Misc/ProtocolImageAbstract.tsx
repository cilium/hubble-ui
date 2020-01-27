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

const css = require("./ProtocolsImages.scss");

export interface ProtocolImageProps {
  readonly maxWidth?: number;
  readonly maxHeight?: number;
  readonly width?: number;
  readonly height?: number;
  readonly respectAspectRatio?: boolean;
  readonly className?: string;
  readonly onClick?: (
    event: React.MouseEvent<HTMLButtonElement | HTMLImageElement>
  ) => void;
}

export const ProtocolImageAbstract = (props: {
  src: string;
  alt?: string;
  maxWidth?: number;
  maxHeight?: number;
  defaultWidth: number;
  defaultHeight: number;
  desiredWidth?: number;
  desiredHeight?: number;
  respectAspectRatio?: boolean;
  className?: string;
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement | HTMLImageElement>
  ) => void;
}) => {
  const { src, alt, className, maxWidth, maxHeight, onClick } = props;
  const { width, height } = calcProtocolImageSizes(props);
  const classNames = [css.image, className].join(" ");
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={classNames}
      onClick={onClick}
    />
  );
};

const calcProtocolImageRatio = ({
  defaultWidth,
  defaultHeight
}: {
  defaultWidth: number;
  defaultHeight: number;
}) => {
  if (defaultWidth >= defaultHeight) {
    return defaultWidth / defaultHeight;
  } else {
    return defaultHeight / defaultWidth;
  }
};

const calcProtocolImageSizes = (sizes: {
  defaultWidth: number;
  defaultHeight: number;
  maxWidth?: number;
  maxHeight?: number;
  desiredWidth?: number;
  desiredHeight?: number;
  respectAspectRatio?: boolean;
}) => {
  const {
    defaultWidth,
    defaultHeight,
    maxWidth,
    maxHeight,
    desiredWidth,
    desiredHeight,
    respectAspectRatio = true
  } = sizes;
  const ratio = calcProtocolImageRatio(sizes);

  let constructedWidth = desiredWidth;
  let constructedHeight = desiredHeight;

  if (typeof desiredWidth !== "number" && typeof desiredHeight !== "number") {
    constructedWidth = defaultWidth;
    constructedHeight = defaultHeight;
  } else if (typeof desiredWidth !== "number") {
    if (defaultWidth >= defaultHeight) {
      constructedWidth = constructedHeight! * ratio;
    } else {
      constructedWidth = constructedHeight! / ratio;
    }
  } else if (typeof desiredHeight !== "number") {
    if (defaultWidth >= defaultHeight) {
      constructedHeight = constructedWidth! / ratio;
    } else {
      constructedHeight = constructedWidth! * ratio;
    }
  }

  let finalWidth = constructedWidth!;
  let finalHeight = constructedHeight!;
  if (typeof maxWidth === "number" && finalWidth > maxWidth) {
    const widthDiff = finalWidth - maxWidth;
    finalWidth -= widthDiff;
    if (defaultWidth >= defaultHeight) {
      finalHeight -= widthDiff / ratio;
    } else {
      finalHeight -= widthDiff * ratio;
    }
  }
  if (typeof maxHeight === "number" && finalHeight > maxHeight) {
    const heightDiff = finalHeight - maxHeight;
    finalHeight -= heightDiff;
    if (defaultWidth >= defaultHeight) {
      finalWidth -= heightDiff * ratio;
    } else {
      finalWidth -= heightDiff / ratio;
    }
  }
  return {
    width: finalWidth,
    height: finalHeight
  };
};
