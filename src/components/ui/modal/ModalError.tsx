import React from "react";
import {Modal} from "./Modal";

type props = {
  title: string;
  description?: string;
  onClose: () => void;
};

export const ModalError = ({
  title,
  description = "",
  onClose,
}: props) => {
  return (
    <Modal onClose={onClose}>
      <div className="p-8">
        <h3 className="text-[18px] font-bold mb-4 ">{title}</h3>
        {description !== "" && <p className="text-[14px]">{description}</p>}
      </div>
    </Modal>
  );
}
