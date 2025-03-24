"use client"
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { useState, useRef, useEffect } from 'react';

interface SelectInputProps {
  options: { value: string, label: string }[];
  selectedOption: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  text?: string;
  className?: string;
  classNameSelect: string;
  disabled?: boolean;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  options,
  selectedOption,
  onChange,
  text,
  className = '',
  classNameSelect = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <p className="text-2xl text-txtWhite font-bold">{text}</p>
      <div ref={dropdownRef}>
        <select
          className={`appearance-none ${classNameSelect}`}
          value={selectedOption}
          onChange={onChange}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
        >
          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
              className='bg-bgCoal'
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className='mr-1 pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
          <ChevronDownIcon className={`w-5 h-5 text-txtWhite transition-all duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>
    </div>
  );
};
