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
import { Cell, PieChart, Pie } from "recharts";

export const GaugeChart: React.SFC<{
  width: number;
  height: number;
  data: Array<{ value: number; color: string }>;
  title?: string | number;
  subtitle?: string;
  subtitleColor?: string;
  note?: string;
  Icon?: React.ComponentType<{ x: number; y: number }>;
  onClick?: () => void;
}> = ({
  width,
  height,
  data,
  title,
  subtitle,
  subtitleColor,
  note,
  Icon,
  onClick
}) => {
  const chartValue = 180;

  const sumValues = data.map(cur => cur.value).reduce((a, b) => a + b);

  const arrowData = [
    { value: chartValue },
    { value: 0 },
    { value: sumValues - chartValue }
  ];

  const pieProps = {
    startAngle: 200,
    endAngle: -20,
    cx: width / 2,
    cy: width / 2
  };

  const pieRadius = {
    innerRadius: width * 0.41,
    outerRadius: width * 0.46
  };

  const Arrow = ({ cx, cy }: { cx: number; cy: number }) => {
    return (
      <g>
        {Icon ? <Icon x={cx} y={cy - height / 3.8} /> : null}
        {title !== "" ? (
          <text
            width={width}
            x={cx}
            y={cy + (Icon ? height / 12 : 0)}
            fontSize={height / 4.444444444}
            fontWeight={700}
            color={subtitleColor ? subtitleColor : "#182026"}
            textAnchor="middle"
          >
            {title}
          </text>
        ) : null}
        {note ? (
          <text
            width={width}
            x={cx}
            y={cy + (Icon ? height / 4.5 : height / 7.5)}
            fontSize={height / 12}
            color="#5C7080"
            textAnchor="middle"
          >
            {note}
          </text>
        ) : null}
        {subtitle !== "" ? (
          <text
            width={width}
            x={cx}
            y={cy + (Icon ? height / 3 : subtitle ? height / 4 : height / 4)}
            fontSize={height / 13.285714286}
            color={subtitleColor ? subtitleColor : "#182026"}
            fontWeight={600}
            textAnchor="middle"
          >
            {subtitle}
          </text>
        ) : null}
      </g>
    );
  };

  return (
    <PieChart
      width={width}
      height={height}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <Pie
        isAnimationActive={false}
        dataKey="value"
        data={data}
        fill="black"
        paddingAngle={0}
        {...pieRadius}
        {...pieProps}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={data[index].color} />
        ))}
      </Pie>
      <Pie
        isAnimationActive={false}
        dataKey="value"
        stroke="none"
        activeIndex={1}
        activeShape={Arrow}
        data={arrowData}
        outerRadius={pieRadius.innerRadius}
        fill="none"
        {...pieProps}
      />
    </PieChart>
  );
};
