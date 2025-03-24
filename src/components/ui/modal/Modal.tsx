import { XMarkIcon } from "@heroicons/react/24/outline";
import React from "react";

type props = {
  onClose?: () => void;
  children: React.ReactNode;
};
export const Modal = ({ onClose, children }: props) => {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div 
        className="absolute flex flex-col gap-4 bg-white text-txtBlack font-maven rounded-lg w-[440px] max-large:w-[400px]
          max-md:w-[380px] max-sm:w-[75%] max-medsmall:w-[90%] max-xsmall:w-[95%]"
      >
        <div className="relative">
          {onClose && (
            <XMarkIcon
              className="text-txtGray w-6 h-6 absolute top-4 right-4 cursor-pointer"
              onClick={onClose}
            />
          )}
          {children}
        </div>
      </div>
    </div>
  );
};