"use client"
import { PlusIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface ButtonApiKey {
    onClick: () => void;
    disabled?: boolean;
}

export const ButtonNewApiKey = ({ onClick, disabled }: ButtonApiKey) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-prinFuchsia 
        transition-colors duration-150 hover:bg-btnFuchsiaHov
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <PlusIcon className="w-5 h-5 text-txtWhite" />
      <p className="text-txtWhite">Nueva llave secreta</p>
    </button>
  );
};
