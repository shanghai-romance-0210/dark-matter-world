import React from "react";
import Image from "next/image";

interface PoopModalProps {
  isOpen: boolean;
  close: () => void;
}

const PoopModal: React.FC<PoopModalProps> = ({ isOpen, close }) => {
  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-zinc-400 bg-opacity-50 backdrop-blur">
      <button onClick={close} className="w-3/4 md:w-1/4 p-0">
        <Image src="/poop.png" alt="Image" width={100} height={100} className="w-full" />
      </button>
    </div>
  );
};

export default PoopModal;