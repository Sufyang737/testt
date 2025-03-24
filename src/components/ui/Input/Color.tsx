import React from 'react';

interface ColorInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ColorInput: React.FC<ColorInputProps> = ({ label, name, value, onChange }) => {
  return (
    <div className='flex gap-5'>
      <label className="text-txtWhite">{label}</label>
			<input 
				type="color" 
				name={name} 
				value={value} 
				onChange={onChange} 
				className='w-10 h-5 cursor-pointer appearance-none
					dark:border-neutral-700' 
			/>
		</div>
  );
};
