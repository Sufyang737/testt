"use client"
import React from 'react';

interface UsageHeaderProps {
  title: string;
  date?: string;
  children?: React.ReactNode;
}

export const UsageHeader: React.FC<UsageHeaderProps> = ({title, date, children}) => {

  return (
    <section className='w-full h-full flex justify-between items-center bg-bgCoal px-10 
      font-maven rounded-lg border-[1px]'
    >
      <div className='flex flex-col'>
        <p className='text-2xl text-txtWhite font-bold'>{title}</p>
        <p className='text-xs text-txtWhite'>{date}</p>
      </div>
      <div className='flex gap-10'>
        {children}
      </div>
    </section>
  )
}



