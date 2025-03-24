import React from "react";
import { Modal } from "./Modal";

type props = {
  title: string;
  description?: string;
  onClose: () => void;
  onAccept: () => void;
};

export const ModalAlert = ({
  onAccept,
  onClose,
  title,
  description = "",
}: props) => {
  return (
    <Modal onClose={onClose}>
      <div className="p-8">
        <h3 className="text-[18px] font-bold mb-4 ">{title}</h3>
        {description !== "" && <p className="text-[14px]">{description}</p>}
        <div className="flex justify-end mt-8 gap-x-6">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={onAccept} className="text-[#984EA2]">
            Aceptar
          </button>
        </div>
      </div>
    </Modal>
  );
}
