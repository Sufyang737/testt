"use client"
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Consumido', value: 25 },
  { name: 'Disponible', value: 75 },
];

const COLORS = ['#217080', '#3DC2DD'];

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value
  } = props;

  return (
    <g>
      <text
        x={cx}
        y={cy}
        dy={-3}
        textAnchor="middle"
        fill={fill}
        fontSize={25}
        fontWeight="bold"
      >
        {`${value}%`}
      </text>
      <text
        x={cx}
        y={cy}
        dy={20}
        textAnchor="middle"
        fill={fill}
        fontSize={18}
        fontWeight="bold"
      >
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

export const PieBillGraphic = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const onPieEnter = useCallback(
    (_: unknown, index: number) => {
      setActiveIndex(index);
    },
    [setActiveIndex]
  );

  return (
    <>
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            onMouseEnter={onPieEnter}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </>
  );
}
