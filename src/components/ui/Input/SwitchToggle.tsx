import React from 'react';

interface SwitchToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

export const SwitchToggle: React.FC<SwitchToggleProps> = ({ label, checked, onChange }) => {
  return (
    <label className="inline-flex items-center cursor-pointer gap-4">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={checked} 
        onChange={onChange} 
      />
      <span className="text-base text-txtWhite">{label}</span>
      <div className="relative w-11 h-6 bg-gray-200 bg-opacity-50 rounded-full peer peer-checked:after:translate-x-full 
        rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute 
        after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 
        after:w-5 after:transition-all peer-checked:bg-secSky"></div>
    </label>
  );
};
