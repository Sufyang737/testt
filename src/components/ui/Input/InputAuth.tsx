"use client"
import { validateEmail, validatePassword } from "@/util/utils";
import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

type inputProps = {
  name: string;
  placeholder: string;
  type: string;
  value: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showError?: boolean;
  className?: string;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  autoComplete?: boolean;
};

export const InputAuth = React.memo(
  ({
    name,
    placeholder,
    type,
    value,
    handleChange,
    showError = false,
    className,
    disabled,
    onBlur,
    onFocus,
    autoComplete = false,
  }: inputProps) => {
    const [error, setError] = useState<string>("");
    const [passwordVisible, setPassword] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      handleChange(e);
      if (name === "email" && !validateEmail(inputValue)) {
        setError("Email inválido");
      } else if (
        (name === "password" || name === "passwordConfirm") &&
        !validatePassword(inputValue)
      ) {
        setError("La contraseña debe tener al menos 8 caracteres");
      } else {
        setError("");
      }
    };

    return (
      <div className={`w-full p-[2px] py-[3px] rounded-[14px] ${
        error && showError && value !== "" 
          ? 'bg-bgCoal' 
          : 'bg-gradient-to-r from-prinFuchsia to-secSky'
      }`}>
        <div className={`relative rounded-[14px] ${
          error && showError && value !== "" 
            ? 'bg-bgCoal' 
            : ''
        }`}>
          <input
            type={type === "password" && !passwordVisible ? "password" : "text"}
            placeholder={placeholder}
            name={name}
            value={value}
            onChange={handleInputChange}
            className={`w-full h-[60px] colorful-shadow text-white px-5 bg-bgCoal rounded-[14px] placeholder:text-txtWhite placeholder:opacity-30
              ${error && showError && value !== "" ? "ring-red-500 ring focus:outline-none" : ""}
              ${className}`}
            autoComplete={autoComplete ? "on" : "off"}
            disabled={disabled}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          {type === "password" && (
            <>
              {passwordVisible ? (
                <EyeSlashIcon
                  className="absolute z-50 right-[20px] top-1/2 -translate-y-1/2 w-6 h-6 text-txtGray cursor-pointer text-txtWhite"
                  onClick={() => setPassword(!passwordVisible)}
                />
              ) : (
                <EyeIcon
                  className="absolute z-50 right-[20px] top-1/2 -translate-y-1/2 w-6 h-6 text-txtGray cursor-pointer text-txtWhite"
                  onClick={() => setPassword(!passwordVisible)}
                />
              )}
            </>
          )}
        </div>
    
        {showError && error && value !== "" && (
          <span className="text-red-500 px-4 block w-full">{error}</span>
        )}
      </div>
    );
  },
);

InputAuth.displayName = "InputAuth";

export default InputAuth;
