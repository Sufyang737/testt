import React from "react";
import { Modal } from "./Modal";

type props = {
  title: string;
  description?: string;
};

export const ModalPageInCreation = ({
  title,
  description = "",
}: props) => {
  return (
      <div className="absolute mt-[70px] inset-0 w-full h-[calc(100%-70px)] bg-black bg-opacity-70 flex items-center justify-center z-[1000]">
        <div 
          className="flex flex-col gap-4 bg-white text-txtBlack font-maven rounded-lg w-[440px] max-large:w-[400px]
            max-md:w-[380px] max-sm:w-[75%] max-medsmall:w-[90%] max-xsmall:w-[95%]"
        >
          <div className="relative">
            <div className="p-8">
              <h3 className="text-[18px] font-bold mb-4 text-center">{title}</h3>
              {description !== "" && <p className="text-[14px] text-center">{description}</p>}
            </div>
          </div>
        </div>
      </div>
  );
}
