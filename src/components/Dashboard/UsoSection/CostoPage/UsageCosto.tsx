"use client"
import { SelectInput } from '@/components/ui';
import { useUser } from '@clerk/nextjs';
import { TokensUsageStats } from '@/components/Dashboard/TokensUsageStats';
import { TokenUsageGraph } from './TokenUsageGraph';
import React, { useState } from 'react';

export const UsageCosto = () => {
  const [selectedOption, setSelectedOption] = useState('mensual');
  const { user } = useUser();

  const options = [
    { value: 'diario', label: 'Diario' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'mensual', label: 'Mensual' },
    { value: 'anual', label: 'Anual' },
  ];

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(event.target.value);
  };

  return (
    <div className='flex gap-10 items-center'>
      <button className='px-7 py-2 bg-bgCoal rounded-md border-[1px] border-prinFuchsia group transition-colors duration-150 hover:bg-btnFuchsiaHov'>
        <p className='text-prinFuchsia text-[15px] font-semibold transition-colors duration-150 group-hover:text-txtWhite'>Exportar</p>
      </button>
      <SelectInput 
        options={options}
        selectedOption={selectedOption}
        onChange={handleSelectChange}
        className='flex justify-center items-center'
        classNameSelect='w-32 px-5 py-2 bg-prinFuchsia rounded-md border-[1px] border-prinFuchsia text-txtWhite text-[15px] font-semibold cursor-pointer focus:border-none focus:outline-none focus:bg-btnFuchsiaHov'
      />
      {user && (
        <div className='flex-1 flex items-center justify-end'>
          <TokenUsageGraph clientId={user.id} />
        </div>
      )}
    </div>
  );
};
