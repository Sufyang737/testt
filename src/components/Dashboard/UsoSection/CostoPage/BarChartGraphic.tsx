"use client";
import React from 'react';
import {
  BarChart,
  Bar,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const data = [
  { name: "1", consumido: 456 },
  { name: "2", consumido: 230 },
  { name: "3", consumido: 345 },
  { name: "4", consumido: 450 },
  { name: "5", consumido: 321 },
  { name: "6", consumido: 235 },
  { name: "7", consumido: 267 },
  { name: "8", consumido: 378 },
  { name: "9", consumido: 210 },
  { name: "10", consumido: 236 },
  { name: "12", consumido: 454 },
  { name: "13", consumido: 902 },
  { name: "14", consumido: 130 },
  { name: "15", consumido: 114 },
  { name: "16", consumido: 107 },
  { name: "17", consumido: 926 },
  { name: "18", consumido: 653 },
  { name: "19", consumido: 366 },
  { name: "20", consumido: 486 },
  { name: "21", consumido: 512 },
  { name: "22", consumido: 302 },
  { name: "23", consumido: 425 },
  { name: "24", consumido: 467 },
  { name: "25", consumido: 190 },
  { name: "26", consumido: 194 },
  { name: "27", consumido: 371 },
  { name: "28", consumido: 376 },
  { name: "29", consumido: 295 },
  { name: "30", consumido: 322 },
  { name: "31", consumido: 246 },
];

export const BarChartGraphic = () => {
  return (
    <>
      <div className='overflow-auto scroll-container'>
        <BarChart
          width={2000} 
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="1" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `$${value}`} />
          <Tooltip />
          <ReferenceLine y={0} stroke="#000" />
          <Bar dataKey="consumido" fill="#3DC2DD" />
        </BarChart>
      </div>
    </>
  );
};
