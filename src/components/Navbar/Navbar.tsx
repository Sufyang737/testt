"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
// import { UserCircleIcon } from "@heroicons/react/24/outline";
import NavLinks from "./NavLinks";
// import { useAuth } from "@/context/AuthContext";
// import { LogoutLogo } from "../../../public/icons";
// import { useRouter } from "next/navigation";
// import { ModalAlert } from "../ui";
import { UserButton } from "@clerk/nextjs";

const Navbar: React.FC = () => {
  const [daysRemaining, setDaysRemaining] = useState(15);

  useEffect(() => {
    // Here you would typically fetch the actual start date from your backend
    const startDate = new Date(localStorage.getItem('trialStartDate') || Date.now());
    const trialDuration = 15; // 15 days trial
    
    const calculateDaysRemaining = () => {
      const now = new Date();
      const diffTime = startDate.getTime() + (trialDuration * 24 * 60 * 60 * 1000) - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, diffDays));
    };

    calculateDaysRemaining();
    const timer = setInterval(calculateDaysRemaining, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(timer);
  }, []);

  return (
    <header
      className={`fixed top-0 flex h-[70px] w-full bg-bgCoal duration-00 border-b-2 border-[#121212]`}
      style={{ zIndex: 999 }}
    >
      <div className="mx-12 flex w-full items-center justify-between">
        <span className="flex items-center max-xl:w-[180px]">
          <Image
            src="/images/ClostechLogo.png"
            alt="LOGO"
            width={155}
            height={35}
          />
        </span>
        <nav className="flex flex-grow justify-center">
          <ul className="flex gap-16 text-txtWhite font-maven">
            <NavLinks />
          </ul>
        </nav>
        <div className="flex items-center gap-4">
          <div className="bg-prinFuchsia/10 px-4 py-2 rounded-full">
            <span className="text-prinFuchsia font-semibold">
              {daysRemaining} días restantes de prueba
            </span>
          </div>
          <UserButton />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
