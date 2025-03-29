"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
// import { UserCircleIcon } from "@heroicons/react/24/outline";
import NavLinks from "./NavLinks";
// import { useAuth } from "@/context/AuthContext";
// import { LogoutLogo } from "../../../public/icons";
// import { useRouter } from "next/navigation";
// import { ModalAlert } from "../ui";
import { UserButton, useUser } from "@clerk/nextjs";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "../ui/ThemeToggle";

const Navbar: React.FC = () => {
  const [daysRemaining, setDaysRemaining] = useState(15);
  const { user, isLoaded } = useUser();
  const { isAuthenticated } = useAuth();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (user && isAuthenticated) {
        setAuthStatus('authenticated');
      } else {
        setAuthStatus('unauthenticated');
      }
    }
  }, [user, isLoaded, isAuthenticated]);

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

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Render different right section based on authentication status
  const renderRightSection = () => {
    if (authStatus === 'loading') {
      return (
        <div className="w-6 h-6 border-t-2 border-primary border-solid rounded-full animate-spin"></div>
      );
    }

    if (authStatus === 'authenticated') {
      return (
        <>
          <div className="bg-primary/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm transition-all hover:shadow-md hover:bg-primary/15">
            <span className="text-primary font-semibold">
              {daysRemaining} días restantes de prueba
            </span>
          </div>
          <ThemeToggle className="mx-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20" />
          <div className="ml-2">
            <UserButton />
          </div>
        </>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <ThemeToggle className="bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20" />
        <Link 
          href="/authentication" 
          className="px-4 py-2 text-gray-600 hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
        >
          Iniciar sesión
        </Link>
        <Link 
          href="/sign-up" 
          className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-all hover:shadow-md shadow-sm"
        >
          Registrarse
        </Link>
      </div>
    );
  };

  return (
    <header
      className={`fixed top-0 flex h-[70px] w-full backdrop-blur-md duration-300 z-50
        ${scrolled 
          ? 'bg-white/90 shadow-md border-b border-gray-200/50' 
          : 'bg-transparent'
        }`}
    >
      <div className="mx-auto px-6 md:px-12 flex w-full max-w-[1400px] items-center justify-between">
        <span className="flex items-center max-xl:w-[180px]">
          <Image
            src="/images/ClostechLogo.png"
            alt="LOGO"
            width={155}
            height={35}
            className="transition-transform hover:scale-105"
          />
        </span>
        <nav className="flex flex-grow justify-center">
          <ul className="flex gap-8 md:gap-16 text-gray-700 font-maven">
            {authStatus === 'authenticated' && <NavLinks />}
          </ul>
        </nav>
        <div className="flex items-center gap-4">
          {renderRightSection()}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
