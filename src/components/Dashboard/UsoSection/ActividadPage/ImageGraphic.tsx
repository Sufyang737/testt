"use client";
import React from 'react';
import {
  XAxis,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';

const data = [
    {
      name: "1",
      uv: 4000,
      pv: 2400,
      amt: 2400,
    },
    {
      name: "2",
      uv: 3000,
      pv: 1398,
      amt: 2210,
    },
    {
      name: "3",
      uv: 2000,
      pv: 9800,
      amt: 2290,
    },
    {
      name: "4",
      uv: 2780,
      pv: 3908,
      amt: 2000,
    },
    {
      name: "5",
      uv: 1890,
      pv: 4800,
      amt: 2181,
    },
    {
      name: "6",
      uv: 2390,
      pv: 3800,
      amt: 2500,
    },
    {
      name: "7",
      uv: 3490,
      pv: 4300,
      amt: 2100,
    },
    {
      name: "8",
      uv: 3490,
      pv: 4300,
      amt: 2100,
    },
  ];

export const ImageGraphic = () => {
  return (
    <>
      <div className='w-full h-full'>
        <div className='w-full flex justify-between items-center gap-20'>
          <div className='w-full flex justify-start'>
            <h3 className='text-start text-txtWhite text-sm'>Solicitudes API</h3>
          </div>
          <div className='w-full flex justify-start'>
            <h3 className='text-start text-txtWhite text-sm'>Imágenes</h3>
          </div>
        </div>

        <div className='w-full h-full flex justify-between items-center gap-20'>
          <div className='overflow-auto scroll-container flex flex-col justify-center gap-5'>
            <LineChart width={1000} height={130} data={data}>
              <Line type="natural" dataKey="pv" stroke="#ffffff" strokeWidth={2} />
              <Tooltip />
              <XAxis dataKey="name" dy={5} fontSize={15} />
            </LineChart>
            <LineChart width={1000} height={130} data={data}>
              <Line type="natural" dataKey="pv" stroke="#8884d8" strokeWidth={2} />
              <Tooltip />
              <XAxis dataKey="name" dy={5} fontSize={15} />
            </LineChart>
          </div>
          <div className='overflow-auto scroll-container flex flex-col justify-center items-center gap-5'>
            <LineChart width={1000} height={130} data={data}>
              <Line type="natural" dataKey="pv" stroke="#ffffff" strokeWidth={2} />
              <Tooltip />
              <XAxis dataKey="name" dy={5} fontSize={15} />
            </LineChart>
            <LineChart width={1000} height={130} data={data}>
              <Line type="natural" dataKey="pv" stroke="#8884d8" strokeWidth={2} />
              <Tooltip />
              <XAxis dataKey="name" dy={5} fontSize={15} />
            </LineChart>
          </div>
        </div>
      </div>
    </>
  );
};
