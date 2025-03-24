import React from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface OwnerSelectionProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ButtonProps {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
}

interface PermissionsProps {
  value: string;
  onChange: (permission: string) => void;
}

interface ResourceSectionProps {
  title: string;
  description: string[];
  options: string[];
  value: string;
  onChange: (value: string) => void;
}



export const OwnerSelection: React.FC<OwnerSelectionProps> = ({ value, onChange }) => (
  <div className="mb-4">
    <p className="mb-2">Owned by</p>
    <div className="flex items-center space-x-4">
      <label className="flex items-center gap-2">
        <div className="w-[14px] h-[14px] rounded-full bg-secSky p-[1px] flex justify-center items-center">
          <input
            type="radio"
            name="owner"
            value="Tu"
            checked={value === "Tu"}
            onChange={onChange}
            className="w-full h-full rounded-full border-[2px] border-black appearance-none focus:bg-secSky bg-bgCoal"
          />
        </div>
        Tú
      </label>
      <label className="flex items-center gap-2">
        <div className="w-[14px] h-[14px] rounded-full bg-secSky p-[1px] flex justify-center items-center">
          <input
            type="checkbo"
            name="owner"
            value="CuentaDeServicio"
            checked={value === "CuentaDeServicio"}
            onChange={onChange}
            className="w-full h-full rounded-full border-[2px] border-black appearance-none focus:bg-secSky bg-bgCoal"
          />
        </div>
        Cuenta de Servicio
      </label>
    </div>
  </div>
);




export const Button: React.FC<ButtonProps> = ({ onClick, active, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1 rounded ${active ? "bg-btnSkyDef text-txtWhite font-semibold" : "bg-transparent text-[#333333]"}`}
  >
    {children}
  </button>
);




export const Permissions: React.FC<PermissionsProps> = ({ value, onChange }) => (
  <div className="mb-6 flex flex-col">
    <p className="mb-2">Permisos</p>
    <div className="flex">
      <div className="space-x-2 border border-[#333333] rounded p-2">
        {["Todos", "Restringidos", "Solo lectura"].map(permission => (
          <Button key={permission} onClick={() => onChange(permission)} active={value === permission}>
            {permission}
          </Button>
        ))}
      </div>
    </div>
  </div>
);




export const ResourceSection: React.FC<ResourceSectionProps> = ({ title, description, options, value, onChange }) => (
  <div className="mb-5 flex items-center justify-between">
    <div>
      <p className="flex gap-2 items-center">
        {title} <InformationCircleIcon className="w-6 h-6" />
      </p>
      {description.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </div>
    <div className="flex">
      <div className="space-x-2 border border-[#333333] rounded p-2">
        {options.map(option => (
          <Button key={option} onClick={() => onChange(option)} active={value === option}>
            {option}
          </Button>
        ))}
      </div>
    </div>
  </div>
);