"use client"
import React from 'react';

export const UsageActividad = () => {

  return (
    <div className='flex gap-10'>
      <button className='px-7 py-2 bg-bgCoal rounded-md border-[1px] border-prinFuchsia group transition-colors duration-150 hover:bg-btnFuchsiaHov'>
        <p className='text-prinFuchsia text-[15px] font-semibold transition-colors duration-150 group-hover:text-txtWhite'>Exportar</p>
      </button>
    </div>
  );
};
