"use client"
import React, { useState, useCallback, useEffect } from 'react';
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts';
import PocketBase from 'pocketbase';

interface TokenStats {
  tokens_used: number;
  total_tokens: number;
  exceeded: number;
}

const COLORS = ['#217080', '#3DC2DD']; // Used, Available colors

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
    value,
    name
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
        {name}
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

export const TokenUsageGraph = ({ clientId }: { clientId: string }) => {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.srv.clostech.tech');
        const record = await pb.collection('api_request').getFirstListItem(
          `client_id = "${clientId}"`
        );
        
        setStats({
          tokens_used: record.tokens_used,
          total_tokens: record.total_tokens,
          exceeded: record.exceeded
        });
      } catch (error) {
        console.error('Error fetching token stats:', error);
      }
    };

    fetchStats();
  }, [clientId]);

  const onPieEnter = useCallback(
    (_: unknown, index: number) => {
      setActiveIndex(index);
    },
    [setActiveIndex]
  );

  if (!stats) return null;

  const usagePercentage = Math.min(Math.round((stats.tokens_used / stats.total_tokens) * 100), 100);
  const availablePercentage = 100 - usagePercentage;

  const data = [
    { name: 'Consumido', value: usagePercentage },
    { name: 'Disponible', value: availablePercentage },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-[200px] h-[200px]">
        <ResponsiveContainer>
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
      </div>
      <div className="flex flex-col items-center gap-5 mt-8">
        <div className="relative w-[200px] flex items-center justify-start">
          <div className="w-4 h-4 bg-secSkyDark rounded-full"></div>
          <p className="absolute ml-8 text-lg text-txtWhite">
            Consumido: {stats.tokens_used.toLocaleString()} tokens
          </p>
        </div>
        <div className="relative w-[200px] flex items-center justify-start">
          <div className="w-4 h-4 bg-secSky rounded-full"></div>
          <p className="absolute ml-8 text-lg text-txtWhite">
            Disponible: {(stats.total_tokens - stats.tokens_used).toLocaleString()} tokens
          </p>
        </div>
      </div>
    </div>
  );
}; 