"use client"
import React, { useState } from 'react';
import { ImageGraphic } from './ImageGraphic';
import { SelectInput } from '@/components/ui';

export const ImageUse = () => {
  const [selectedOption, setSelectedOption] = useState('mensual');

  const options = [
    { value: 'enero', label: 'Enero' },
    { value: 'febrero', label: 'Febrero' },
    { value: 'marzo', label: 'Marzo' },
    { value: 'abril', label: 'Abril' },
    { value: 'mayo', label: 'Mayo' },
    { value: 'junio', label: 'Junio' },
    { value: 'julio', label: 'Julio' },
    { value: 'agosto', label: 'Agosto' },
    { value: 'septiembre', label: 'Septiembre' },
    { value: 'octubre', label: 'Octubre' },
    { value: 'noviembre', label: 'Noviembre' },
    { value: 'diciembre', label: 'Diciembre' },
  ];
  
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(event.target.value);
  };

  return (
    <section className='w-full h-full flex flex-col justify-between items-center bg-bgCoal p-7 gap-5
      font-maven rounded-lg border-[1px]'
    >
      <SelectInput 
        options={options}
        selectedOption={selectedOption}
        onChange={handleSelectChange}
        text='Imágenes'
        className='w-full flex justify-between items-center px-2'
        classNameSelect='w-32  py-2 bg-bgCoal rounded-md text-txtWhite text-lg font-semibold cursor-pointer focus:border-none focus:outline-none'
      />
      <div className='w-full h-full px-2'>
        <div className='w-full h-full flex justify-center items-center'>
          <ImageGraphic />
        </div>
      </div>
    </section>
  )
}
